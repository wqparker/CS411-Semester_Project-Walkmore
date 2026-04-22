export const mockRoutes = {
  minWalking: {
    path: ["Current Location", "\"W 34 ST/BROADWAY\"", "\"6 AV/W 45 ST\"", "Destination"],
    totalT: 14, walkT: 9, dist: 1.602,
    coords: [[40.7484,-73.9857],[40.749624,-73.987617],[40.75703,-73.982378],[40.7579747,-73.9855426]]
  },
  fastest: {
    path: ["Current Location", "\"W 34 ST/BROADWAY\"", "\"6 AV/W 45 ST\"", "Destination"],
    totalT: 14, walkT: 9, dist: 1.602,
    coords: [[40.7484,-73.9857],[40.749624,-73.987617],[40.75703,-73.982378],[40.7579747,-73.9855426]]
  },
  maxWalkingWithinLimit: {
    path: ["Current Location", "\"W 34 ST/6 AV\"", "\"6 AV/W 45 ST\"", "Destination"],
    totalT: 14, walkT: 10, dist: 1.599,
    coords: [[40.7484,-73.9857],[40.749773,-73.98753],[40.75703,-73.982378],[40.7579747,-73.9855426]]
  }
};

export const mockGeoJSON = {"type":"Feature","geometry":{"type":"LineString","coordinates":[[-73.98585,40.7482],[-73.98712,40.74875],[-73.98812,40.74914],[-73.98774,40.74968],[-73.98761,40.74963],[-73.98766,40.74962],[-73.98782,40.74972],[-73.98123,40.7588],[-73.98115,40.75877],[-73.98179,40.75782],[-73.98218,40.75727],[-73.98237,40.75703],[-73.98255,40.75678],[-73.98252,40.75677],[-73.98261,40.75666],[-73.98265,40.75667],[-73.98289,40.75675],[-73.98288,40.75677],[-73.98549,40.75786]]},"properties":{"source":"Google Routes API","usage":"OSM Navigation","fullTransitInfo":[{"lineName":"F Train (6 Av Local)","departureStop":"34 St-Herald Sq","arrivalStop":"47-50 Sts-Rockefeller Ctr","stopCount":3,"vehicleType":"SUBWAY","deplat":40.749718,"deplon":-73.98782299999999,"arrlat":40.7587743,"arrlon":-73.9811545}]}};