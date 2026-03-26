const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(pointA, pointB) {
  const lat1 = toRadians(pointA.lat);
  const lon1 = toRadians(pointA.lng);
  const lat2 = toRadians(pointB.lat);
  const lon2 = toRadians(pointB.lng);

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

function buildStationMap(stations) {
  const stationMap = new Map();
  for (const station of stations) {
    stationMap.set(station.id, station);
  }
  return stationMap;
}

function getNearestStations(point, stations, topK = 20) {
  return stations
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

// BFS that generates multiple simple paths, not just one
function bfsEnumeratePaths(startId, endId, stationMap, maxPaths = 12, maxDepth = 10) {
  if (!stationMap.has(startId) || !stationMap.has(endId)) {
    return [];
  }

  const queue = [[startId]];
  const results = [];

  while (queue.length > 0 && results.length < maxPaths) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    if (currentId === endId) {
      results.push(path);
      continue;
    }

    if (path.length > maxDepth) {
      continue;
    }

    const currentStation = stationMap.get(currentId);
    const neighbors = currentStation.neighbors || [];

    for (const neighbor of neighbors) {
      const neighborId = typeof neighbor === "string" ? neighbor : neighbor.id;

      // avoid cycles
      if (!path.includes(neighborId) && stationMap.has(neighborId)) {
        queue.push([...path, neighborId]);
      }
    }
  }

  return results;
}

function getEdgeMinutes(fromStation, toId, defaultTransitMinutes = 4) {
  const neighbors = fromStation.neighbors || [];
  const match = neighbors.find((n) =>
    typeof n === "string" ? n === toId : n.id === toId
  );

  if (!match) return defaultTransitMinutes;
  if (typeof match === "string") return defaultTransitMinutes;

  return match.transitMinutes ?? defaultTransitMinutes;
}

function routeSignature(route) {
  const ids = route.transit.stationPath.map((s) => s.id).join("->");
  return `${route.startWalk.toStation.id}|${ids}|${route.endWalk.fromStation.id}`;
}

function pickDistinct(sortedRoutes, usedSignatures) {
  for (const route of sortedRoutes) {
    const sig = routeSignature(route);
    if (!usedSignatures.has(sig)) {
      usedSignatures.add(sig);
      return route;
    }
  }
  return null;
}

function planThreeRoutes(startPoint, destinationPoint, stations, options = {}) {
  const {
    topK = 20,
    maxWalkMeters = 2500,
    maxPathsPerPair = 8,
    maxDepth = 10,
    defaultTransitMinutes = 4,
    maxExtraMinutesForWalking = 15,
  } = options;

  const stationMap = buildStationMap(stations);

  const startCandidates = getNearestStations(startPoint, stations, topK)
    .filter((item) => item.straightLineMeters <= maxWalkMeters);

  const endCandidates = getNearestStations(destinationPoint, stations, topK)
    .filter((item) => item.straightLineMeters <= maxWalkMeters);

  const candidateRoutes = [];

  for (const startCandidate of startCandidates) {
    for (const endCandidate of endCandidates) {
      const paths = bfsEnumeratePaths(
        startCandidate.station.id,
        endCandidate.station.id,
        stationMap,
        maxPathsPerPair,
        maxDepth
      );

      for (const pathIds of paths) {
        const stationPath = pathIds.map((id) => stationMap.get(id));

        let transitMinutes = 0;
        for (let i = 0; i < stationPath.length - 1; i++) {
          transitMinutes += getEdgeMinutes(
            stationPath[i],
            stationPath[i + 1].id,
            defaultTransitMinutes
          );
        }

        const startWalkMeters = startCandidate.straightLineMeters;
        const endWalkMeters = endCandidate.straightLineMeters;
        const totalWalkMeters = startWalkMeters + endWalkMeters;

        const startWalkMinutes = estimateWalkMinutes(startWalkMeters);
        const endWalkMinutes = estimateWalkMinutes(endWalkMeters);
        const totalWalkMinutes = startWalkMinutes + endWalkMinutes;

        const totalMinutes = transitMinutes + totalWalkMinutes;

        candidateRoutes.push({
          startWalk: {
            from: startPoint,
            toStation: startCandidate.station,
            distanceMeters: Math.round(startWalkMeters),
            estimatedMinutes: Number(startWalkMinutes.toFixed(1)),
          },
          transit: {
            stationPath,
            hopCount: Math.max(0, stationPath.length - 1),
            estimatedMinutes: Number(transitMinutes.toFixed(1)),
          },
          endWalk: {
            fromStation: endCandidate.station,
            to: destinationPoint,
            distanceMeters: Math.round(endWalkMeters),
            estimatedMinutes: Number(endWalkMinutes.toFixed(1)),
          },
          metrics: {
            totalWalkMeters: Math.round(totalWalkMeters),
            totalWalkMinutes: Number(totalWalkMinutes.toFixed(1)),
            totalMinutes: Number(totalMinutes.toFixed(1)),
          },
        });
      }
    }
  }

  if (candidateRoutes.length === 0) {
    return {
      minTime: null,
      maxWalking: null,
      balanced: null,
      allCandidates: [],
    };
  }

  // 1. Minimum time
  const minTimeSorted = [...candidateRoutes].sort(
    (a, b) => a.metrics.totalMinutes - b.metrics.totalMinutes
  );
  const minTimeRoute = minTimeSorted[0];

  // 2. Maximum walking
  // Keep it reasonable: allow some extra time over fastest route
  const walkEligible = candidateRoutes.filter(
    (r) => r.metrics.totalMinutes <= minTimeRoute.metrics.totalMinutes + maxExtraMinutesForWalking
  );

  const maxWalkingPool = walkEligible.length > 0 ? walkEligible : candidateRoutes;

  const maxWalkingSorted = [...maxWalkingPool].sort((a, b) => {
    if (b.metrics.totalWalkMeters !== a.metrics.totalWalkMeters) {
      return b.metrics.totalWalkMeters - a.metrics.totalWalkMeters;
    }
    return a.metrics.totalMinutes - b.metrics.totalMinutes;
  });

  const maxWalkingRoute = maxWalkingSorted[0];

  // 3. Balanced
  // lower score is better: reward walking, penalize too much time
  const maxWalk = Math.max(...candidateRoutes.map((r) => r.metrics.totalWalkMeters));
  const minWalk = Math.min(...candidateRoutes.map((r) => r.metrics.totalWalkMeters));
  const maxTime = Math.max(...candidateRoutes.map((r) => r.metrics.totalMinutes));
  const minTime = Math.min(...candidateRoutes.map((r) => r.metrics.totalMinutes));

  const balancedSorted = [...candidateRoutes]
    .map((route) => {
      const normalizedTime =
        maxTime === minTime ? 0 : (route.metrics.totalMinutes - minTime) / (maxTime - minTime);

      const normalizedWalk =
        maxWalk === minWalk ? 0 : (route.metrics.totalWalkMeters - minWalk) / (maxWalk - minWalk);

      // tweak these weights if needed
      const balanceScore = 0.6 * normalizedTime - 0.4 * normalizedWalk;

      return {
        ...route,
        metrics: {
          ...route.metrics,
          balanceScore: Number(balanceScore.toFixed(3)),
        },
      };
    })
    .sort((a, b) => a.metrics.balanceScore - b.metrics.balanceScore);

  // try to keep the 3 routes distinct
  const used = new Set();
  const distinctMinTime = pickDistinct(minTimeSorted, used) || minTimeRoute;
  const distinctMaxWalking = pickDistinct(maxWalkingSorted, used) || maxWalkingRoute;
  const distinctBalanced = pickDistinct(balancedSorted, used) || balancedSorted[0];

  return {
    minTime: distinctMinTime,
    maxWalking: distinctMaxWalking,
    balanced: distinctBalanced,
    allCandidates: candidateRoutes,
  };
}

module.exports = {
  haversineMeters,
  getNearestStations,
  bfsEnumeratePaths,
  planThreeRoutes,
};
