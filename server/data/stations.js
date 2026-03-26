const stations = [
  {
    id: "S1",
    name: "Station A",
    lat: 40.7500,
    lng: -73.9900,
    neighbors: [
      { id: "S2", transitMinutes: 4 },
      { id: "S3", transitMinutes: 6 }
    ]
  },
  {
    id: "S2",
    name: "Station B",
    lat: 40.7520,
    lng: -73.9850,
    neighbors: [
      { id: "S1", transitMinutes: 4 },
      { id: "S4", transitMinutes: 5 }
    ]
  }
];

module.exports = stations;
