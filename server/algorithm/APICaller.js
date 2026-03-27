const apiKey = 'AIzaSyBYQW3QIOsvT2xQ9vnbx2GCsRf6Yage7zs';

async function getWalkingRoute(srclat, srclon, dstlat, dstlon) {
  //returns shortest walking distance between two location
  //Expects four inputs, latitude and longitude of origin, followed by latitude and longitude of destination
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: srclat, longitude: srclon } } },
        destination: { location: { latLng: { latitude: dstlat, longitude: dstlon } } },
        travelMode: "WALK"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("error:", errorText);
      return;
    }

    const data = await response.json();
    const route = data.routes[0]
    //console.log("result:", data); 
    // uncomment when you need a log
    return {
      distance: route.distanceMeters,     
      totalTime: route.duration,      
      walkingTime: route.duration  
    };
  } catch (e) {
    console.error(e);
  }
}

async function getTransitRoute(srclat, srclon, dstlat, dstlon) {
  //returns shortest walking distance between two location
  //Expects four inputs, latitude and longitude of origin, followed by latitude and longitude of destination
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.steps'
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: srclat, longitude: srclon } } },
        destination: { location: { latLng: { latitude: dstlat, longitude: dstlon} } },
        travelMode: "TRANSIT",
        transitPreferences: { allowedTravelModes: ["BUS","SUBWAY"]} //Modify this field to add / delete mode of transit
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("error:", errorText);
      return;
    }

    const data = await response.json();
    const route = data.routes[0]
    const transitLegs = route.legs[0]; 
      let pureWalkingSeconds = 0;

      transitLegs.steps.forEach(step => {
      // Add Walking time within the route
      if (step.travelMode === "WALK") {
          pureWalkingSeconds += parseInt(step.staticDuration || step.duration);
      }
      });
    //console.log("Walking Time: ", pureWalkingSeconds, "Distance:", route.distanceMeters, "Total time:", route.duration); 
    //Uncomment when you need a log

    return {
      distance: parseInt(route.distanceMeters),     
      totalTime: parseInt(route.duration),      
      walkingTime: pureWalkingSeconds   
    };
  } catch (e) {
    console.error(e);
  }
}

export { getWalkingRoute, getTransitRoute };