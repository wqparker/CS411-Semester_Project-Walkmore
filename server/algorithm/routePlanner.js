import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Node } from '../Graph/GraphNode.js';
import {Location} from '../Graph/Location.js';
import {TransitGraph} from '../Graph/Graph.js';
import {getWalkingRoute, getTransitRoute, getWalkingNavigationRoute, getTransitNavigationRoute} from './APICaller.js';
import polyline from '@mapbox/polyline';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(pointA, pointB) {
  const lat1 = toRadians(pointA.Location.lat);
  const lon1 = toRadians(pointA.Location.lon);
  const lat2 = toRadians(pointB.Location.lat);
  const lon2 = toRadians(pointB.Location.lon);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function estimateWalkMinutes(distanceMeters, walkingSpeedMetersPerMinute = 84) {
  return distanceMeters / walkingSpeedMetersPerMinute;
}

function buildStationMap() {
  const rawData = fs.readFileSync(join(__dirname, '../Graph/all_stops.json'), 'utf-8');
  const stopsData = JSON.parse(rawData);
  const stationMap = new Map();
  const allNodes = stopsData.map(stop => {
    // create location info from stop information
    const loc = new Location(
        stop.name, 
        "", // address is empty
        stop.lat, 
        stop.lon
    );
    // Create Node from id and Location
    stationMap.set(stop.id, new Node(stop.id, loc));
  });
  //console.log(`${allNodes.length} Nodes created.`);
  return stationMap;
}
function getNearestStations(point, stations, topK = 20) {
  const stationsArray = (stations instanceof Map) ? Array.from(stations.values()) : stations;
  return stationsArray
    .map((station) => {
      const straightLineMeters = haversineMeters(point, station);
      return {
        station,
        straightLineMeters,
        walkMinutes: estimateWalkMinutes(straightLineMeters),
      };
    })
    .sort((a, b) => a.straightLineMeters - b.straightLineMeters)
    .slice(0, topK);
}

function findThreeRoutes(Graph, maxArrivalTime, maxWalkingTime) {
    console.log('findThreeRoutes called with:', { maxArrivalTime, maxWalkingTime });
    console.log('Graph node count:', Object.keys(Graph.nodes).length);
    console.log('Graph edge count:', Object.values(Graph.adjacencyList).reduce((sum, edges) => sum + edges.length, 0));
    console.log('Edges from node 0:', Graph.adjacencyList[0]);
    console.log('Edges to node 1:', Object.entries(Graph.adjacencyList)
      .filter(([_, edges]) => edges.some(e => e.nodeId === '1'))
      .map(([id]) => id));

    let queue = [[0, 0, 0, 0,[]]]; 
    const targetHalf = maxWalkingTime / 2; 

    let minWalkRoute = null;
    let maxWalkRoute = null;
    let fastestRoute = null;
    while (queue.length > 0) {
        let [curr, totalT, walkT, dist, path] = queue.shift();

        // 1. if the path goes beyond arrival time or walking time, skip that path. 
        if (totalT > maxArrivalTime || walkT > maxWalkingTime) continue;

        // 2. If the path arrives at dst:
        if (curr == 1) {
            const routeData = { path: [...path, curr], totalT, walkT, dist };
            //Update the minimum walking route
            if (!minWalkRoute || walkT < minWalkRoute.walkT) {
                minWalkRoute = routeData;
            }
            //Update the maximum walking route
            if (!maxWalkRoute || walkT > maxWalkRoute.walkT) {
                maxWalkRoute = routeData;
            }
            //Update balanced walking route
            if (!fastestRoute || totalT < fastestRoute.totalT) {
                fastestRoute = routeData;
            }
            continue;
        }

        // 3. look at its neighbors
        const neighbors = Graph.getNextStops(curr); 
        for (const neighbor of neighbors) {
            // cycle safeguard, although would not have one
            if (path.includes(neighbor.nodeId)) continue; 

            queue.push([
                neighbor.nodeId,
                totalT + neighbor.transitTime, // gets total time
                walkT + neighbor.walkTime,      // gets total walking time
                dist + neighbor.distance, //gets total distance
                [...path, curr]
            ]);
        }
    }

    if (!minWalkRoute) return "No routes found";

    const result = {
        minWalking: minWalkRoute,
        maxWalkingWithinLimit: maxWalkRoute,
        fastest: fastestRoute
    };

    return result;
}

export async function CalculatePath(srclat, srclon, dstlat, dstlon, ArrivalTime, WalkingTime){
    const src = new Location("Current Location","",srclat, srclon);
    const dst = new Location("Destination","",dstlat, dstlon);
    const srcNode = new Node(0, src);
    const dstNode = new Node(1,dst);
    const stations = buildStationMap();
    const calculatedRadius = 2 + (18 / Math.log(120)) * Math.log(WalkingTime);
    const nearestFromSrc = getNearestStations(srcNode, stations, calculatedRadius);
    const nearestFromDst = getNearestStations(dstNode, stations, calculatedRadius);
    const notoverlap = nearestFromDst.filter(itemB => 
        !nearestFromSrc.some(itemA => itemA.station.id === itemB.station.id)
    );
    //Uncomment if you need to check what are the nearest stations from each endpoint
    // console.log("\n closest stations from src (Top 20):");
    // console.table(nearestFromSrc.map(item => ({
    // ID: item.station.id,
    // Name: item.station.Location.name,
    // Distance: `${Math.round(item.straightLineMeters)}m`,
    // Walk: `${item.walkMinutes} min`
    // })));
    // console.log("\n closest stations from dst (Top 20):");
    // console.table(nearestFromDst.map(item => ({
    // ID: item.station.id,
    // Name: item.station.Location.name,
    // Distance: `${Math.round(item.straightLineMeters)}m`,
    // Walk: `${item.walkMinutes} min`
    // })));

    const Graph = new TransitGraph(src, dst);
    //Add all the selected stations as edges of the graph
    console.log("Adding stations into the graph...");
    nearestFromSrc.forEach(item => {
        const s = item.station;
        Graph.addStop(s.id, s.Location.name, s.Location.address, s.Location.lat, s.Location.lon);
    });
    nearestFromDst.forEach(item => {
        const s = item.station;
        Graph.addStop(s.id, s.Location.name, s.Location.address, s.Location.lat, s.Location.lon);
    });
    //If you want to see nodes, uncomment
    //Graph.displayGraph();

    //Add Routes as edges of the graph.
    console.log("Adding Edges between two group of stations")
    //Holds all the request for API call for Parallel call
    const edgePromises = [];

    // Add edges from src to its nearest stations
    for (const itemA of nearestFromSrc) {
        const p = getWalkingRoute(src.lat, src.lon, itemA.station.Location.lat, itemA.station.Location.lon)
        .then(res => {
            if (res) {
                const walkMin = Math.round(parseInt(res.totalTime) / 60); //convert sec to min
                Graph.addEdge("0", itemA.station.id, walkMin, walkMin, res.distance / 1000);
            }
        });
        edgePromises.push(p);
    }

    // Add edges from nearest Stations to dst
    for (const itemB of nearestFromDst) {
        const p = getWalkingRoute(itemB.station.Location.lat, itemB.station.Location.lon, dst.lat, dst.lon)
        .then(res => {
            if (res) {
                const walkMin = Math.round(parseInt(res.totalTime) / 60); //convert sec to min
                Graph.addEdge(itemB.station.id, "1", walkMin, walkMin, res.distance / 1000);
            }
        });
        edgePromises.push(p);
    }

    //Iterate stations from each 'Island' to find fastest connection
    if(notoverlap.length === 0){
        for (const itemB of nearestFromSrc) {
        const p = getWalkingRoute(itemB.station.Location.lat, itemB.station.Location.lon, dst.lat, dst.lon)
        .then(res => {
            if (res) {
                const walkMin = Math.round(parseInt(res.totalTime) / 60); //convert sec to min
                Graph.addEdge(itemB.station.id, "1", walkMin, walkMin, res.distance / 1000);
            }
        });
        edgePromises.push(p);
        }
    }
    if(notoverlap.length>0){
    for (const itemA of nearestFromSrc) {
    for (const itemB of notoverlap) {
        if (itemA.station.id === itemB.station.id) continue;

        // adds to bucket of API call to be made
        const promise = getTransitRoute(
            itemA.station.Location.lat, itemA.station.Location.lon,
            itemB.station.Location.lat, itemB.station.Location.lon
        ).then(res => {
            if (res) {
                const transitMin = Math.round(parseInt(res.totalTime) / 60);
                const walkMin = Math.round(res.walkingTime / 60);
        
                // add the result to the graph
                Graph.addEdge(itemA.station.id, itemB.station.id, transitMin, walkMin, res.distance / 1000);
            }
        });
        edgePromises.push(promise);
    }
    }
    }

    // wait for the calls
    await Promise.all(edgePromises);
    console.log('Transit edges between islands:', 
      Object.entries(Graph.adjacencyList)
        .filter(([id]) => id !== '0' && id !== '1')
        .filter(([_, edges]) => edges.length > 0)
        .map(([id, edges]) => `${id} -> ${edges.map(e => e.nodeId).join(', ')}`)
    );

    console.log("All edges added successfully.");
    //If you want to see the edges, uncomment
    //Graph.displayGraph();

    const results = findThreeRoutes(Graph,ArrivalTime, WalkingTime);
    const temp = {
        minWalking: getCoordsForPath(results.minWalking, Graph),
        fastest: getCoordsForPath(results.fastest, Graph),
        maxWalkingWithinLimit: getCoordsForPath(results.maxWalkingWithinLimit, Graph)
    }
    //console.log(JSON.stringify(await Navigate(temp.fastest))); 
    //printRouteSummary("Minimum Walking", test);
    // printRouteSummary("Minimum Walking", results.minWalking);
    // printRouteSummary("Fastest", results.fastest);
    // printRouteSummary("Maximum Walking", results.maxWalkingWithinLimit);
    console.log('ROUTES OUTPUT:', JSON.stringify(temp));
    return temp;
}

function getCoordsForPath(route, Graph){
    if (!route || !route.path) {
        console.warn("route does not exist.");
        return null;
    }

    const { path, totalT, walkT, dist} = route;

    // iterate path to acquire stop id
    const coordinatePath = path.map(nodeId => {
        const node = Graph.nodes[nodeId];
        if (!node || !node.Location) {
            console.warn(`node does not exist.`);
            return null;
        }

        // Extract location info
        return [node.Location.lat, node.Location.lon];
    }).filter(coord => coord !== null); 
    // change path display to name
    const namePath = route.path.map(nodeId => Graph.nodes[nodeId].Location.name);
    return {
        ...route,
        path: namePath,
        coords: coordinatePath // [ [lat, lon], [lat, lon], ... ]
    };
}

async function getNavigationRoute(route){
    //takes in a route object, returns a navigatable route in google routes format
    if (!route || !route.coords) {
        console.log(`Can not find a path.`);
        return;
    }
    const { path, totalT, walkT, dist , coords} = route;
    let combinedCoordinates = [];
    let TransitSegment = [];
    try {
        // Iterate path to get navigatable route for selected route
        for (let i = 0; i < path.length - 1; i++) {
            const [srclat,srclon] = coords[i];
            const [dstlat, dstlon] = coords[i + 1];
            
            let encodedPolyline = "";
            
            if (i==1) {
                // if transit route
                const res = await getTransitNavigationRoute(srclat, srclon, dstlat, dstlon);
                encodedPolyline = res?.NavigationRoute;
                if (res?.TransitSegment) {
                    TransitSegment.push(...res.TransitSegment);
                }
            } else {
                // is walking route
                const res = await getWalkingNavigationRoute(srclat, srclon, dstlat, dstlon);
                encodedPolyline = res?.NavigationRoute;
            }

            if (!encodedPolyline) continue;

            // decode the returned polyline
            const decoded = polyline.decode(encodedPolyline);

            if (combinedCoordinates.length === 0) {
                combinedCoordinates.push(...decoded);
            } else {
                combinedCoordinates.push(...decoded.slice(1));
            }
        }

        const finalEncodedPolyline = polyline.encode(combinedCoordinates);
        return {
            ...route,
            NavigationRoute: finalEncodedPolyline, // Google route object
            TransitSegment: TransitSegment
        };

    } catch (e) {
        console.error("Error fetching navigation route:", e);
        return null;
    }
}

function convertToOsmGeoJSON(encodedPolyline, TransitSegment) {
    // decode the google route
    const decodedCoords = polyline.decode(encodedPolyline);

    // convert to OSM format, which requires switching orders of lat and long
    const osmCoords = decodedCoords.map(([lat, lng]) => [lng, lat]);

    // encode it as GeoJSON format
    const geojson = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": osmCoords
        },
        "properties": {
            "source": "Google Routes API",
            "usage": "OSM Navigation",
            "fullTransitInfo": TransitSegment
        }
    };

    return geojson;
}

export async function Navigate(route){
    //Call this function with selected user route from the frontend to acquire navigatable path
    try {
        const nav = await getNavigationRoute(route);

        if (!nav || !nav.NavigationRoute) {
            console.error("Cannot navigate.");
            return null;
        }

        //Wrap the navigation route to Open Street Map compatible format
        const osmData = convertToOsmGeoJSON(nav.NavigationRoute, nav.TransitSegment);
        
        return osmData;
    } catch (error) {
        console.error("Navigate error:", error);
        return null;
    }
}
//CalculatePath(40.7684, -73.9857, 40.7686, -73.9855, 40, 120);