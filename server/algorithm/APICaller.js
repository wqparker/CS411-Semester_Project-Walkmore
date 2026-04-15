import 'dotenv/config';

const apiKey = process.env.GOOGLE_API_KEY;

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
      return null;
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

async function getAddressFromCoord(input){
    //Assumes the input is in coordinates
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${input}&key=${apiKey}`;
    try {
      const response = await fetch(geoUrl);
      const result = await response.json();
      return result.results[0];
    } catch (error) {
      console.error('Geocoding Error:', error);
      return;
    }
}

async function getAddressFromName(input){
  //Assumes inut is name or address
  const placesUrl = 'https://places.googleapis.com/v1/places:searchText';
    const data = { textQuery: input };
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.addressComponents'
    };

    try {
      const response = await fetch(placesUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      return result.places[0];
    } catch (error) {
      console.error('Places Error:', error);
      return null;
    }
}
export { getWalkingRoute, getTransitRoute , getAddressFromCoord, getAddressFromName};