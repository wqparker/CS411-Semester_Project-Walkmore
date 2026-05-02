# WalkMore - Step-Optimized Transit & Walking Navigation
**CS411 Group Project** | Team: Bryan, Lily, Will, Zach

WalkMore is a NYC-focused navigation app that optimizes commute routes to incorporate more walking. Users set a destination and arrival time, specify how much they're willing to walk, and the system returns a transit & walking route tailored to those constraints. The app also tracks weekly step progress and stores trip history.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Dependencies](#installing-dependencies)
3. [Environment Variables](#environment-variables)
4. [Running the App Locally](#running-the-app-locally)
5. [Using the App](#using-the-app)
6. [Testing](#testing)
7. [Packages](#packages)
8. [Project Structure](#project-structure)

---

## Prerequisites

Node.js must be installed to use React and Express.js. If you don't have it:

1. Go to https://nodejs.org/en/download
2. Download the **LTS version** for your machine
3. Run the installer with default settings — **uncheck "Tools for Native Modules"** when prompted
4. Close and reopen your terminal after installing

Verify the install worked:
```bash
node --version
npm --version
```
Both should return valid version numbers.

---

## Installing Dependencies

Run `npm install` in both the client and server directories (e.g.):
```bash
../client $ npm install
../server $ npm install
```

---

## Environment Variables

The app requires two environment files that are **not committed to the repository**. Create them manually before running the app.

### `client/.env.local`
```dotenv
VITE_GOOGLE_CLIENT_ID=        # Google OAuth 2.0 client ID for the frontend login button
```

### `server/.env`
```dotenv
GOOGLE_API_KEY=               # Google Maps Platform API key (Routes, Places, Geocoding)
MONGO_URI=                    # MongoDB Atlas connection string
JWT_SECRET=                   # Secret string used to sign and verify JWT tokens
GOOGLE_CLIENT_ID=             # Google OAuth 2.0 client ID (must match the frontend value)
USE_MOCK=false                # Set to true to bypass live API calls and use mock route data 
```

> **Note on `USE_MOCK`:** Setting `USE_MOCK=true` routes all route calculation calls to `server/mockRoute.js`, which contains a pre-computed result for a trip from the Empire State Building to Times Square. This is useful for development and testing when you want to avoid consuming API credits. 

---

## Running the App Locally

The frontend and backend must be run in **two separate, concurrent terminals**.

**Terminal 1 — Frontend:**
```bash
../client $ npm run dev
```

**Terminal 2 — Backend:**
```bash
../server $ node server.js
```

### Verifying Everything Works

**Frontend** — visit http://localhost:5173/

You should see the WalkMore landing screen. Since the app is designed for mobile dimensions, it will appear on the left side of a desktop browser by default. For the best experience, use Chrome's mobile device emulator:
1. Press `F12` to open DevTools
2. Click the phone/tablet icon in the top-left of the DevTools panel
3. Chrome will enter mobile emulation mode, which also emulates touch inputs

**Backend** — visit http://localhost:5000/api/test

You should see:
```json
{ "message": "WalkMore backend is running!" }
```

---

## Using the App

### Creating an Account / Logging In
WalkMore uses Google OAuth for authentication — no password is required. From the landing screen, click **Sign in with Google** and complete the OAuth flow. Your account is created automatically on first login and your session is maintained via a JWT stored locally.

### Viewing Your Profile
To view the profile page, click on the user icon located at the top right corner of the screen. It will display Google profile that user logs in, and display birthday, height, and weight that the user set upon account creation. 

### Enabling the DEV Mode
If navigated to the profile screen, there is an option to enable DEV mode. The DEV mode enables to manually set the starting point using preset values (I would recommend doing so, enabling current location will locate to Boston, which will cause failure to find a route within time constraint.)

### Planning a Route
By clicking on search bar at the top that says "**Where to**?", the user will be guided to the planning page. There the user can input Destination in name, address, or coordinates formatted as latitude, longitude. Then the user must input arrival time, which expected to be between [1,180], and maximum walking time within [1,120]. Then the user can choose between 3 modes, but can also change it later in the results screen. 

### Viewing Route Results
Once the user puts valid inputs and hit **Find Routes**, the system will return the route results. It will show expected distance, total time, and walking time. If there exists no route that is feasible, system will not display a route. Unfortunately, the user will have to try again from route planning page with more lenient inputs. 

### Navigating a Route
Assuming that the system has returned valid routes in the results screen, the user may hit on the "**Start Navigation**" button to go back to the map and see the path. The small popup will show up at the top of the map showing the segments of the path. 
You can open the dev mode option by clicking on orange **</>** button. There you can jump to the next station using **jump** button, and by doing so the pop-up above will change accordingly. Once you reach the destination, it will show a green page with done button. Click on the **Done** button to save data of the trip. It will save only if you have allowed the system to acquire health data in the beginning. 

### Viewing Weekly Progress
Click on **Progress** page at the bottom right to navigate to the progress page. By doing so, the system will display daily statistics, along with weekly / monthly plot. User can toggle by clicking on the corresponding button.  

## Testing

The test suite lives in `server/tests/` and covers backend routes and core logic. To run it:

```bash
../server $ npm run test:coverage
```

The terminal will output each test and its pass/fail status, along with a breakdown of statement, branch, function, and line coverage.

> **Note:** `db.js` will show low coverage in the report. This is expected — the database connection is mocked during tests so a live MongoDB Atlas instance is not required to run the suite.

---

## Packages

### Client (`client/package.json`)

| Package | Purpose |
|---|---|
| `react` / `react-dom` | Core UI framework |
| `react-leaflet` / `leaflet` | Interactive map rendering using OpenStreetMap tiles |
| `@react-oauth/google` | Google OAuth login button and token handling |
| `vite` | Frontend build tool and dev server |
| `eslint` | Code linting |

### Server (`server/package.json`)

| Package | Purpose |
|---|---|
| `express` | HTTP server and API routing |
| `mongodb` | MongoDB driver for database access |
| `google-auth-library` | Verifies Google OAuth ID tokens on the backend |
| `jsonwebtoken` | Issues and validates JWTs for session management |
| `dotenv` | Loads environment variables from `.env` |
| `cors` | Enables cross-origin requests from the frontend |
| `@mapbox/polyline` | Decodes encoded polyline strings from the Google Routes API for map rendering |
| `jest` / `supertest` | Test runner and HTTP integration testing |
| `babel-jest` / `@babel/core` | Transpiles ES module syntax for Jest compatibility |

---

## Project Structure

```
CS411-Walkmore/
├── client/                         # React frontend (Vite)
│   ├── public/                     # Static assets (favicon, icons)
│   ├── src/
│   │   ├── components/
│   │   │   └── map/                # Map-specific UI components
│   │   │       ├── DemoPanel.jsx         # Demo controls overlay
│   │   │       ├── MapHelpers.jsx        # Utility components for map display
│   │   │       ├── MapMarkers.jsx        # Custom map marker components
│   │   │       └── NavigationPanel.jsx   # Turn-by-turn directions overlay
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # Global auth state (user, token, login/logout)
│   │   │   └── LocationContext.jsx       # Global location/map state
│   │   ├── hooks/
│   │   │   └── useNavigationSession.js   # Custom hook managing active navigation state
│   │   ├── screens/                # Top-level screen components (one per app view)
│   │   │   ├── LandingScreen.jsx         # Entry point with Google login
│   │   │   ├── MapScreen.jsx             # Main map view
│   │   │   ├── RoutePlanningScreen.jsx   # Route input form (destination, time, walk preference)
│   │   │   ├── RouteResultsScreen.jsx    # Displays computed route options
│   │   │   ├── AccountScreen.jsx         # Account creation / login screen
│   │   │   ├── ProfileScreen.jsx         # User profile and settings
│   │   │   └── ProgressScreen.jsx        # Weekly step and trip history tracking
│   │   ├── services/
│   │   │   └── tripService.js            # API calls related to trip saving and retrieval
│   │   ├── utils/
│   │   │   └── directions.js             # Helpers for parsing and formatting direction data
│   │   ├── App.jsx                       # Root component; handles screen routing
│   │   └── main.jsx                      # App entry point; mounts React to the DOM
│   ├── .env.local                        # Frontend environment variables (not committed)
│   └── vite.config.js                    # Vite configuration (dev server, proxy)
│
├── server/                         # Express backend
│   ├── algorithm/                  # Route planning algorithm module
│   │   ├── routePlanner.js               # Core BFS-based route optimization logic
│   │   └── APICaller.js                  # Wrapper for Google Routes API calls
│   ├── Graph/                      # NYC transit graph data structures
│   │   ├── Graph.js                      # Graph class; loads and connects transit nodes
│   │   ├── GraphNode.js                  # Individual node (transit stop) representation
│   │   ├── Location.js                   # Geographic location helper class
│   │   └── all_stops.json                # Full dataset of ~12,000 NYC transit stops
│   ├── models/                     # MongoDB data models (Mongoose-style schemas)
│   │   ├── User.js                       # User schema (googleId, name, email, etc.)
│   │   ├── Trip.js                       # Trip schema (route taken, steps, timestamps)
│   │   └── DailyActivity.js              # Daily step/activity aggregation schema
│   ├── tests/                      # Jest test suite
│   │   └── auth.test.js                  # Authentication endpoint tests
│   ├── data/
│   │   └── stations.js                   # Supplementary station reference data
│   ├── server.js                         # Express app entry point; defines all API routes
│   ├── db.js                             # MongoDB connection setup
│   ├── routePlanner.js                   # Top-level route planner used by server routes
│   ├── ValidateInput.js                  # Input validation logic for route planning requests
│   ├── mockRoute.js                      # Pre-computed mock route (Empire State → Times Square)
│   ├── .env                              # Server environment variables (not committed)
│   └── jest.config.cjs                   # Jest configuration
│
└── APItest/                        # Standalone scripts for testing Google API integrations
    ├── testRoutes.js                     # Tests Google Routes API directly
    ├── testPlaces.js                     # Tests Google Places / autocomplete
    ├── testGeoCoding.js                  # Tests Geocoding API
    └── testDistanceMatrix.js             # Tests Distance Matrix API
```
