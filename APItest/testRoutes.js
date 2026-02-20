async function getRoute() {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const apiKey = '';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: 37.419, longitude: -122.082 } } },
        destination: { location: { latLng: { latitude: 37.417, longitude: -122.079 } } },
        travelMode: "WALK"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("result:", data);
  } catch (e) {
    console.error(e);
  }
}

getRoute();