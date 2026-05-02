import 'dotenv/config';

/* API Caller class  
  
  Responsible for any google API calls that the system has to make. 

  The API key must be inside the env folder as
  GOOGLE_API_KEY=?

  env folder must exist inside the server folder. (CS411-Walkmore/server)
*/ 
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

async function getNameFromCoord(input) {
  //given a coordinate, convert it to name
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${input}&key=${apiKey}`;

  try {
    const response = await fetch(geoUrl);
    const result = await response.json();

    if (result.status !== 'OK' || !result.results || result.results.length === 0) {
      return null;
    }


    const place = result.results.find(res =>
      res.types.includes('point_of_interest') ||
      res.types.includes('establishment') ||
      res.types.includes('premise')
    );

    let name = "Unknown Location";
    
    if (place?.address_components?.[0]?.long_name) {
      name = place.address_components[0].long_name;
    } else {
      name = result.results[0].address_components[0].long_name;
    }

    return { name };
  } catch (error) {
    console.error('Geocoding Error:', error);
    return null;
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

async function getTransitNavigationRoute(srclat, srclon, dstlat, dstlon) {
  //returns navigatable transit path between two location
  //Expects four inputs, latitude and longitude of origin, followed by latitude and longitude of destination
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.steps.transitDetails,routes.legs.steps.travelMode'
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
    const steps = route.legs[0].steps;

    //extract transit info
    let transitSegments = [];
    steps.forEach(step => {
      if (step.travelMode === "TRANSIT" && step.transitDetails) {
        const details = step.transitDetails;
        transitSegments.push({
          lineName: details.transitLine.name || details.transitLine.shortName,
          departureStop: details.stopDetails.departureStop.name, 
          arrivalStop: details.stopDetails.arrivalStop.name,     
          stopCount: details.stopCount, 
          vehicleType: details.transitLine.vehicle.type, // BUS, SUBWAY
          deplat: details.stopDetails.departureStop.location.latLng.latitude,
          deplon: details.stopDetails.departureStop.location.latLng.longitude,
          arrlat: details.stopDetails.arrivalStop.location.latLng.latitude,
          arrlon: details.stopDetails.arrivalStop.location.latLng.longitude,
        });
      }
    });

    return {
      NavigationRoute: route.polyline.encodedPolyline,
      TransitSegment: transitSegments 
    };
  } catch (e) {
    console.error(e);
  }
}

async function getWalkingNavigationRoute(srclat, srclon, dstlat, dstlon) {
  //returns navigatable walking path between two location
  //Expects four inputs, latitude and longitude of origin, followed by latitude and longitude of destination
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: srclat, longitude: srclon } } },
        destination: { location: { latLng: { latitude: dstlat, longitude: dstlon} } },
        travelMode: "WALK",
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("error:", errorText);
      return null;
    }

    const data = await response.json();
    const route = data.routes[0]

    return {
      NavigationRoute: route.polyline.encodedPolyline, 
      TransitSegment: null
    };
  } catch (e) {
    console.error(e);
  }
}
export { getWalkingRoute, getTransitRoute , getAddressFromCoord, getNameFromCoord, getAddressFromName, getTransitNavigationRoute, getWalkingNavigationRoute};