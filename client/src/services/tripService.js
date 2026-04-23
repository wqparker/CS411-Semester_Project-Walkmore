const THRESHOLD_KM = 0.1;

export async function saveTrip(token, {
  routeObj,
  cumulativeDist,
  user,
  optimization,
  startTime,
  directions,
  currentStepIndex,
}) {
  if (!routeObj || !token || cumulativeDist < THRESHOLD_KM) return;

  const estimatedSteps = Math.round(routeObj.walkT * 100); // ~100 steps/min average
  const walkDistKm = (routeObj.walkT / routeObj.totalT) * routeObj.dist;
  const estimatedCalories = Math.round((user?.weight || 70) * walkDistKm * 1.036);

  await fetch('/api/trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      destination: routeObj.path?.[routeObj.path.length - 1],
      path: routeObj.path,
      startTime,
      endTime: new Date(),
      distKm: cumulativeDist,
      walkMinutes: routeObj.walkT,
      totalMinutes: routeObj.totalT,
      estimatedSteps,
      estimatedCalories,
      optimization,
      completed,
    }),
  });
}