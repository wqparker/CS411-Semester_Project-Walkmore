import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { CalculatePath } from './algorithm/routePlanner.js';
import { checkDestination } from './ValidateInput.js';
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

app.listen(5000, () => console.log('Server running on port 5000'));