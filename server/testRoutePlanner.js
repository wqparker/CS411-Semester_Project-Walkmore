const { planThreeRoutes } = require("./algorithm/routePlanner");
const stations = require("./data/stations");

const startPoint = { lat: 40.7484, lng: -73.9857 }; // example: Midtown
const destinationPoint = { lat: 40.7308, lng: -73.9973 }; // example: downtown-ish

const result = planThreeRoutes(startPoint, destinationPoint, stations, {
  topK: 5,
  maxWalkMeters: 3000,
  maxPathsPerPair: 6,
  maxDepth: 8,
  defaultTransitMinutes: 4,
  maxExtraMinutesForWalking: 15,
});

console.log(JSON.stringify(result, null, 2));
