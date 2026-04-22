import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { CalculatePath, Navigate } from './algorithm/routePlanner.js';
import { checkDestination } from './ValidateInput.js';

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from './db.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(cors());
app.use(express.json());

const HARDCODED_SRC_LAT = 40.7484;
const HARDCODED_SRC_LON = -73.9857;

async function geocodeDestination(address) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results[0]) {
    return null;
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lon: lng };
}

app.get('/api/test', (req, res) => {
  res.json({ message: 'WalkMore backend is running!' });
});
app.post('/api/validate', async (req, res) => {
  try{
  const { input } = req.body;
  const result = await checkDestination(input);
  if(!result){
    return res.status(404).json({ error: 'The server may be down.' });
  }
  res.json(result);
  } catch(err){
    console.error('Location validation error:', err);
    res.status(500).json({ error: 'Internal server error during location validation.' });
  }
});
app.post('/api/route', async (req, res) => {
  const { destination, arrivalTime, walkingMins, optimization } = req.body;

  if (!destination || !arrivalTime || !walkingMins || !optimization) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const coords = await geocodeDestination(destination);
  if (!coords) {
    return res.status(400).json({ error: 'Could not find destination. Please try a different address.' });
  }
  try {
    const routes = await CalculatePath(
      HARDCODED_SRC_LAT,
      HARDCODED_SRC_LON,
      coords.lat,
      coords.lon,
      parseInt(arrivalTime),
      parseInt(walkingMins)
    );

    if (!routes) {
      return res.status(404).json({ error: 'No routes found for the given inputs.' });
    }

    // Return the matching route based on optimization preference
    const routeMap = {
      time: routes.fastest,
      walking: routes.maxWalkingWithinLimit,
      balanced: routes.minWalking
    };

    const selectedRoute = routeMap[optimization];
    res.json({ route: selectedRoute, allRoutes: routes });

  } catch (err) {
    console.error('Route calculation error:', err);
    res.status(500).json({ error: 'Internal server error during route calculation.' });
  }
});

app.get('/api/autocomplete', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: [] });

  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}&components=country:us&location=40.7484,-73.9857&radius=50000`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const suggestions = data.predictions.map(p => p.description);
    res.json({ suggestions });
  } catch (err) {
    console.error('Autocomplete error:', err);
    res.status(500).json({ suggestions: [] });
  }
});

app.post('/api/navigate', async (req, res)=> {
  try{
    const {route} = req.body;
    if(!route){
      return res.status(400).json({ error: 'route does not exist. Please provide valid route'});
    }
    const result = await Navigate(route);
    if (!result) {
      return res.status(500).json({ error: 'Failed to generate navigation data' });
    }
    res.json(result);
  } catch{
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Middleware to verify JWT on protected routes
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/google
// flow: 'login' | 'register'

app.post('/api/auth/google', async (req, res) => {
  const { token, flow } = req.body;
  if (!token || !flow) return res.status(400).json({ error: 'Missing token or flow' });

  try {
    // Use access token to get user info from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: google_id, email, name, picture } = await googleRes.json();

    const db = await getDb();
    const users = db.collection('users');
    const existingUser = await users.findOne({ google_id });

    if (flow === 'login') {
      if (!existingUser) {
        return res.status(404).json({ error: 'No account found. Please create an account first.' });
      }
      if (!existingUser.profile_complete) {
        return res.status(403).json({ error: 'Account setup incomplete. Please create an account first.' });
      }
      const jwtToken = jwt.sign({ google_id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token: jwtToken, user: existingUser });
    }

    if (flow === 'register') {
      if (existingUser && existingUser.profile_complete) {
        return res.status(409).json({ error: 'Account already exists. Please sign in instead.' });
      }
      // Create or update incomplete user
      if (!existingUser) {
        await users.insertOne({
          google_id, email, name, picture,
          profile_complete: false,
          created_at: new Date(),
        });
      }
      const jwtToken = jwt.sign({ google_id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token: jwtToken, google_id, email, name, picture });
    }

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// PUT /api/auth/profile - complete profile after Google registration
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { dob, height_cm, weight, units } = req.body;
  if (!dob || !height_cm || !weight || !units) {
    return res.status(400).json({ error: 'Missing required profile fields' });
  }
  try {
    const db = await getDb();
    await db.collection('users').updateOne(
      { google_id: req.user.google_id },
      { $set: { dob, height_cm, weight, units, profile_complete: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ google_id: req.user.google_id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// DELETE /api/auth/account
app.delete('/api/auth/account', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('users').deleteOne({ google_id: req.user.google_id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(5000, () => console.log('Server running on port 5000'));
}