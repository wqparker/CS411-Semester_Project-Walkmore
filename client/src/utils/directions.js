export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildDirections(route, transitStops) {
  if (!route?.path || !route?.coords) return [];
  const { path, coords } = route;
  const dirs = [];

  for (let i = 0; i < path.length - 1; i++) {
    const toName = path[i + 1];
    const toCoord = coords[i + 1];

    if (i === 1 && transitStops.length > 0) {
      const seg = transitStops[0];
      dirs.push({
        type: 'transit',
        instruction: `Board ${seg.lineName}`,
        subtext: `${seg.departureStop} → ${seg.arrivalStop} · ${seg.stopCount} stop${seg.stopCount !== 1 ? 's' : ''}`,
        icon: seg.vehicleType === 'SUBWAY' ? '🚇' : '🚌',
        targetCoord: toCoord,
      });
    } else {
      dirs.push({
        type: 'walk',
        instruction: i === path.length - 2 ? 'Walk to your destination' : `Walk to ${toName}`,
        subtext: toName,
        icon: '🚶',
        targetCoord: toCoord,
      });
    }
  }

  dirs.push({
    type: 'arrive',
    instruction: 'You have arrived!',
    subtext: path[path.length - 1],
    icon: '🎯',
    targetCoord: null,
  });

  return dirs;
}