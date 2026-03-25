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

**Backend** — visit http://localhost:5000/api/test
You should see:
```json
{ "message": "WalkMore backend is running!" }
```
