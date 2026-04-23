import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import { getDb } from '../db.js';
import { checkDestination } from '../ValidateInput.js';
import { CalculatePath, Navigate } from '../algorithm/routePlanner.js';
import { createTrip } from '../models/Trip.js';
import { createDailyActivity } from '../models/DailyActivity.js';

// Module mocks (hoisted by babel-jest before any imports run)
jest.mock('../db.js');
jest.mock('../algorithm/routePlanner.js', () => ({ 
  CalculatePath: jest.fn(), 
  Navigate: jest.fn(), 
}));
jest.mock('../ValidateInput.js', () => ({ checkDestination: jest.fn() }));

// Constants 

const TEST_SECRET = 'test-secret';
process.env.JWT_SECRET = TEST_SECRET;
process.env.GOOGLE_CLIENT_ID = 'test-client-id';

const BASE_USER = {
  google_id: 'google-uid-123',
  email: 'will@test.com',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
  profile_complete: true,
};

// Helpers 

/** Returns an Authorization header with a signed JWT for the given payload. */
function authHeader(payload = { google_id: BASE_USER.google_id, email: BASE_USER.email }) {
  return { Authorization: `Bearer ${jwt.sign(payload, TEST_SECRET)}` };
}

/**
 * Configures getDb() to return a fake collection with the given method overrides.
 * Any method not overridden resolves to {} by default.
 * Returns the ops object so tests can assert on individual methods.
 */
function mockDb(overrides = {}) {
  const ops = {
    findOne:   jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  getDb.mockResolvedValue({ collection: jest.fn().mockReturnValue(ops) });
  return ops;
}

/**
 * Mocks the global fetch for the Google userinfo endpoint.
 * ok=true returns a user payload; ok=false simulates an invalid token response.
 */
function mockGoogleFetch(ok = true, userData = {
  sub: BASE_USER.google_id,
  email: BASE_USER.email,
  name: BASE_USER.name,
  picture: BASE_USER.picture,
}) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValueOnce(userData),
  });
}

// Setup / teardown 
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn(); // reset fetch between tests
});

// POST /api/auth/google 

describe('POST /api/auth/google', () => {

  test('400 when token is missing from body', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ flow: 'login' }); // no token
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('400 when flow is missing from body', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ token: 'some-token' }); // no flow
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('401 when Google userinfo returns an error response', async () => {
    mockGoogleFetch(false); // ok: false
    const res = await request(app)
      .post('/api/auth/google')
      .send({ token: 'bad-token', flow: 'login' });
    expect(res.status).toBe(401);
  });

  // login flow

  describe('flow: login', () => {

    test('404 when no account exists for that Google ID', async () => {
      mockGoogleFetch();
      mockDb({ findOne: jest.fn().mockResolvedValue(null) });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'tok', flow: 'login' });

      expect(res.status).toBe(404);
    });

    test('403 when account exists but profile is not complete', async () => {
      mockGoogleFetch();
      mockDb({ findOne: jest.fn().mockResolvedValue({ ...BASE_USER, profile_complete: false }) });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'tok', flow: 'login' });

      expect(res.status).toBe(403);
    });

    test('200 with JWT token on successful login', async () => {
      mockGoogleFetch();
      mockDb({ findOne: jest.fn().mockResolvedValue(BASE_USER) });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'tok', flow: 'login' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');

      // Verify the returned JWT is valid and contains expected claims
      const decoded = jwt.verify(res.body.token, TEST_SECRET);
      expect(decoded.google_id).toBe(BASE_USER.google_id);
      expect(decoded.email).toBe(BASE_USER.email);
    });

  });

  // register flow 

  describe('flow: register', () => {

    test('409 when account already exists and profile is complete', async () => {
      mockGoogleFetch();
      mockDb({ findOne: jest.fn().mockResolvedValue(BASE_USER) }); // complete account

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'tok', flow: 'register' });

      expect(res.status).toBe(409);
    });

    test('200 and calls insertOne for a brand new user', async () => {
      mockGoogleFetch();
      const ops = mockDb({ findOne: jest.fn().mockResolvedValue(null) }); // no existing user

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'tok', flow: 'register' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(ops.insertOne).toHaveBeenCalledTimes(1);
      // Check that the inserted doc has profile_complete: false
      expect(ops.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ profile_complete: false })
      );
    });

    test('200 and skips insertOne for existing incomplete account', async () => {
      mockGoogleFetch();
      const ops = mockDb({
        findOne: jest.fn().mockResolvedValue({ ...BASE_USER, profile_complete: false }),
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'tok', flow: 'register' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(ops.insertOne).not.toHaveBeenCalled(); // user already exists
    });

  });

});

// PUT /api/auth/profile 

describe('PUT /api/auth/profile', () => {

  const FULL_PROFILE = { dob: '2000-01-01', height_cm: 175, weight: 70, units: 'metric' };

  test('401 when no Authorization header is present', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .send(FULL_PROFILE); // no auth header
    expect(res.status).toBe(401);
  });

  test('401 when JWT is invalid', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set({ Authorization: 'Bearer not-a-real-token' })
      .send(FULL_PROFILE);
    expect(res.status).toBe(401);
  });

  test('400 when required profile fields are missing', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeader())
      .send({ dob: '2000-01-01' }); // missing height_cm, weight, units
    expect(res.status).toBe(400);
  });

  test('200 and calls updateOne on a valid request', async () => {
    const ops = mockDb();

    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeader())
      .send(FULL_PROFILE);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(ops.updateOne).toHaveBeenCalledTimes(1);
    expect(ops.updateOne).toHaveBeenCalledWith(
      { google_id: BASE_USER.google_id },
      { $set: expect.objectContaining({ profile_complete: true, ...FULL_PROFILE }) }
    );
  });

});

// GET /api/auth/me 

describe('GET /api/auth/me', () => {

  test('401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('401 when JWT is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: 'Bearer garbage' });
    expect(res.status).toBe(401);
  });

  test('404 when user is not found in the database', async () => {
    mockDb({ findOne: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  test('200 with user object when found', async () => {
    mockDb({ findOne: jest.fn().mockResolvedValue(BASE_USER) });

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.google_id).toBe(BASE_USER.google_id);
  });

});

// DELETE /api/auth/account 

describe('DELETE /api/auth/account', () => {

  test('401 when no Authorization header is present', async () => {
    const res = await request(app).delete('/api/auth/account');
    expect(res.status).toBe(401);
  });

  test('401 when JWT is invalid', async () => {
    const res = await request(app)
      .delete('/api/auth/account')
      .set({ Authorization: 'Bearer garbage' });
    expect(res.status).toBe(401);
  });

  test('200 and calls deleteOne on success', async () => {
    const ops = mockDb();

    const res = await request(app)
      .delete('/api/auth/account')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(ops.deleteOne).toHaveBeenCalledTimes(1);
    expect(ops.deleteOne).toHaveBeenCalledWith({ google_id: BASE_USER.google_id });
  });

});

// GET /api/test 

describe('GET /api/test', () => {
  test('200 with running message', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

// POST /api/validate 

describe('POST /api/validate', () => {
  test('400 if input missing', async () => {
    const res = await request(app).post('/api/validate').send({});
    expect(res.status).toBe(404); // checkDestination returns null/falsy
  });

  test('404 when checkDestination returns null', async () => {
    checkDestination.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/validate').send({ input: 'nowhere' });
    expect(res.status).toBe(404);
  });

  test('200 on valid destination', async () => {
    checkDestination.mockResolvedValueOnce({ code: 0, lat: 40.7, lon: -73.9, address: 'NYC' });
    const res = await request(app).post('/api/validate').send({ input: 'Empire State Building' });
    expect(res.status).toBe(200);
  });
});

// GET /api/autocomplete 

describe('GET /api/autocomplete', () => {
  test('returns empty suggestions for short query', async () => {
    const res = await request(app).get('/api/autocomplete').query({ q: 'a' });
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual([]);
  });

  test('200 with suggestions on valid query', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        suggestions: [
          { placePrediction: { text: { text: 'New York, NY, USA' } } },
          { placePrediction: { text: { text: 'Newark, NJ, USA' } } },
        ],
      }),
    });
    const res = await request(app).get('/api/autocomplete').query({ q: 'New York' });
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(2);
  });
});

// POST /api/route 

describe('POST /api/route', () => {
  const VALID_BODY = {
    destination: 'Times Square',
    arrivalTime: '60',
    walkingMins: '20',
    optimization: 'time',
    srcLat: 40.7484,
    srcLon: -73.9857,
  };

  test('400 when required fields are missing', async () => {
    const res = await request(app).post('/api/route').send({ destination: 'Times Square' });
    expect(res.status).toBe(400);
  });

  test('400 when geocoding returns null', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ status: 'ZERO_RESULTS', results: [] }),
    });
    const res = await request(app).post('/api/route').send(VALID_BODY);
    expect(res.status).toBe(400);
  });

  test('200 with route on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        status: 'OK',
        results: [{ geometry: { location: { lat: 40.758, lng: -73.985 } } }],
      }),
    });
    CalculatePath.mockResolvedValueOnce({
      fastest: { path: [0, 1], totalT: 30, walkT: 10 },
      minWalking: { path: [0, 1], totalT: 45, walkT: 5 },
      maxWalkingWithinLimit: { path: [0, 1], totalT: 40, walkT: 20 },
    });
    const res = await request(app).post('/api/route').send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('route');
  });

  test('404 when CalculatePath returns null', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        status: 'OK',
        results: [{ geometry: { location: { lat: 40.758, lng: -73.985 } } }],
      }),
    });
    CalculatePath.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/route').send(VALID_BODY);
    expect(res.status).toBe(404);
  });
});

// POST /api/navigate
 
describe('POST /api/navigate', () => {
 
  test('400 when route is missing from body', async () => {
    const res = await request(app).post('/api/navigate').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
 
  test('500 when Navigate returns null', async () => {
    Navigate.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/navigate')
      .send({ route: { path: ['A', 'B'], coords: [[0, 0], [1, 1]] } });
    expect(res.status).toBe(500);
  });
 
  test('200 with GeoJSON on success', async () => {
    const mockGeoJson = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-73.98, 40.74]] },
      properties: { fullTransitInfo: [] },
    };
    Navigate.mockResolvedValueOnce(mockGeoJson);
 
    const res = await request(app)
      .post('/api/navigate')
      .send({ route: { path: ['A', 'B'], coords: [[40.74, -73.98], [40.75, -73.97]] } });
 
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('type', 'Feature');
    expect(res.body.geometry).toHaveProperty('type', 'LineString');
  });
 
});
 
// POST /api/trips
 
describe('POST /api/trips', () => {
 
  const VALID_TRIP = {
    destination: 'Grand Central',
    path: ['Penn Station', 'Grand Central'],
    startTime: new Date('2025-01-01T10:00:00Z').toISOString(),
    endTime: new Date('2025-01-01T10:30:00Z').toISOString(),
    distKm: 1.5,
    walkMinutes: 15,
    totalMinutes: 30,
    estimatedSteps: 1800,
    estimatedCalories: 95,
    optimization: 'balanced',
    completed: true,
  };
 
  test('401 when no Authorization header is present', async () => {
    const res = await request(app).post('/api/trips').send(VALID_TRIP);
    expect(res.status).toBe(401);
  });
 
  test('401 when JWT is invalid', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set({ Authorization: 'Bearer garbage' })
      .send(VALID_TRIP);
    expect(res.status).toBe(401);
  });
 
  test('400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set(authHeader())
      .send({ destination: 'Grand Central' }); // missing startTime, endTime, distKm
    expect(res.status).toBe(400);
  });
 
  test('200 and calls insertOne on trips collection', async () => {
    const ops = mockDb();
 
    const res = await request(app)
      .post('/api/trips')
      .set(authHeader())
      .send(VALID_TRIP);
 
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(ops.insertOne).toHaveBeenCalledTimes(1);
    expect(ops.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        google_id: BASE_USER.google_id,
        destination: 'Grand Central',
        distKm: 1.5,
        completed: true,
      })
    );
  });
 
  test('200 and upserts daily_activity with $inc', async () => {
    const ops = mockDb();
 
    await request(app)
      .post('/api/trips')
      .set(authHeader())
      .send(VALID_TRIP);
 
    expect(ops.updateOne).toHaveBeenCalledTimes(1);
    expect(ops.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ google_id: BASE_USER.google_id }),
      expect.objectContaining({
        $inc: expect.objectContaining({
          totalSteps: VALID_TRIP.estimatedSteps,
          totalDistKm: VALID_TRIP.distKm,
          totalCalories: VALID_TRIP.estimatedCalories,
          totalWalkMinutes: VALID_TRIP.walkMinutes,
          tripCount: 1,
        }),
      }),
      { upsert: true }
    );
  });
 
});
 
// GET /api/trips/recent
 
describe('GET /api/trips/recent', () => {
 
  test('401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/trips/recent');
    expect(res.status).toBe(401);
  });
 
  test('401 when JWT is invalid', async () => {
    const res = await request(app)
      .get('/api/trips/recent')
      .set({ Authorization: 'Bearer garbage' });
    expect(res.status).toBe(401);
  });
 
  test('200 with array of trips', async () => {
    const fakeTripList = [
      { destination: 'Grand Central', distKm: 1.5 },
      { destination: 'Times Square', distKm: 0.8 },
    ];
 
    // mock find().sort().limit().toArray() chain
    getDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(fakeTripList),
            }),
          }),
        }),
      }),
    });
 
    const res = await request(app)
      .get('/api/trips/recent')
      .set(authHeader());
 
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].destination).toBe('Grand Central');
  });
 
});
 
// GET /api/activity/weekly
 
describe('GET /api/activity/weekly', () => {
 
  test('401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/activity/weekly');
    expect(res.status).toBe(401);
  });
 
  test('401 when JWT is invalid', async () => {
    const res = await request(app)
      .get('/api/activity/weekly')
      .set({ Authorization: 'Bearer garbage' });
    expect(res.status).toBe(401);
  });
 
  test('200 returns 7 days of activity by default', async () => {
    const fakeActivity = [
      { date: '2025-01-01', totalSteps: 3000 },
      { date: '2025-01-02', totalSteps: 4500 },
    ];
 
    getDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(fakeActivity),
          }),
        }),
      }),
    });
 
    const res = await request(app)
      .get('/api/activity/weekly')
      .set(authHeader());
 
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('totalSteps', 3000);
  });
 
  test('200 respects custom days query param', async () => {
    getDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
 
    const res = await request(app)
      .get('/api/activity/weekly')
      .query({ days: 30 })
      .set(authHeader());
 
    expect(res.status).toBe(200);
  });
 
});
 
// Models
 
describe('createTrip model', () => {
 
  test('returns object with all expected fields', () => {
    const input = {
      google_id: 'uid-123',
      destination: 'Grand Central',
      path: ['Penn Station', 'Grand Central'],
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T10:30:00Z'),
      distKm: 1.5,
      walkMinutes: 15,
      totalMinutes: 30,
      estimatedSteps: 1800,
      estimatedCalories: 95,
      optimization: 'balanced',
      completed: true,
    };
 
    const trip = createTrip(input);
 
    expect(trip.google_id).toBe('uid-123');
    expect(trip.destination).toBe('Grand Central');
    expect(trip.distKm).toBe(1.5);
    expect(trip.estimatedSteps).toBe(1800);
    expect(trip.estimatedCalories).toBe(95);
    expect(trip.completed).toBe(true);
    expect(trip.optimization).toBe('balanced');
  });
 
});
 
describe('createDailyActivity model', () => {
 
  test('returns object with zeroed counters and correct keys', () => {
    const activity = createDailyActivity({ google_id: 'uid-123', date: '2025-01-01' });
 
    expect(activity.google_id).toBe('uid-123');
    expect(activity.date).toBe('2025-01-01');
    expect(activity.totalSteps).toBe(0);
    expect(activity.totalDistKm).toBe(0);
    expect(activity.totalCalories).toBe(0);
    expect(activity.totalWalkMinutes).toBe(0);
    expect(activity.tripCount).toBe(0);
  });
 
});