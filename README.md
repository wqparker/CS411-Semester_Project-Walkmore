# CS411-Group-Project
Group consists of Bryan, Lily, Will, Zach

# CS411 WalkMore — Setup Guide

## Prerequisites
Node.js must be installed to use React and Express.js. If you don't have it:

1. Go to https://nodejs.org/en/download
2. Download the **LTS version** for your machine
3. Run the installer with default settings — **uncheck "Tools for Native Modules"** when prompted
4. Close and reopen your terminal after installing

Verify the install worked by running:
```bash
node --version
npm --version
```
Both should return valid version numbers.

## Installing Project Dependencies
Run the following commands from the root of the repo:
```bash
cd client
npm install
cd ../server
npm install
```

## Running the App Locally
The frontend and backend must be run in **two separate terminals**.

**Terminal 1 — Frontend:**
```bash
cd client
npm run dev
```

**Terminal 2 — Backend:**
```bash
cd server
node server.js
```

## Verifying Everything Works
**Frontend** — visit http://localhost:5173/
You should see a default React/Vite "Get Started" screen.
Since the app is in a mobile device scale, it will by default appear on the left of the screen.
If you use Chrome to view the localhost, it has a nifty emulator.
Press f12, and in the top left of the f12 tab will be a phone and laptop symbol.
Press this symbol and Chrome will enter mobile device emulator mode.
This makes for a much cleaner viewing, as well as emulates many mobile functionalities, such as touch inputs.

**Backend** — visit http://localhost:5000/api/test
You should see:
```json
{ "message": "WalkMore backend is running!" }
```


## Testing Suite
The testing suite lives within the /server/ directory since it most effectively tests the actual functionality that lives in the backend and between API calls. In order to the run the testing suite, execute:
```bash
npm run test:coverage
```
The terminal should output each test and its passing status, as well as a breakdown of statement, branch, function, and line coverage. Note that the db.js file has very low coverage since we mock the database during tests so as to not require a live DB Atlas instance. 