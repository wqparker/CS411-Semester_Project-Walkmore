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

  const strideLength = user?.height_cm ? user.height_cm * 0.00413 : 0.7;
  const estimatedSteps = Math.round((cumulativeDist * 1000) / strideLength);
  const estimatedCalories = Math.round((user?.weight || 70) * cumulativeDist * 1.036);
  const completed = directions[currentStepIndex]?.type === 'arrive';

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