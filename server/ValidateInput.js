import {getAddressFromCoord, getAddressFromName} from './algorithm/APICaller.js';
async function checkDestination(input) {
  /** The function is expected to return 4 fields. 
      The result as a code:
        0 : success, meainng that the destination is in boundary(NYC)
        1 : fail, the location exists, but the destination is out of boundary  
        2 : fail, the location does not exist
      Its latitude, longitude, and formatted address.
  **/
  const coordRegex = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;
  const match = input.match(coordRegex);
  if (match) {
    /** If the input matches format as coordinates **/
    const result = await getAddressFromCoord(input); 
    const lat = match[1];
    const lon = match[2];
    if (result == null){
        return {
            code: 2, // does not exist
            lat: null,
            lon: null,
            address: null
        };
    }
    const isNYC = result.address_components.some(c => 
      (c.types.includes("locality") || c.types.includes("sublocality")) && 
      ["New York", "Brooklyn", "Bronx", "Queens", "Staten Island"].includes(c.long_name)
      );
    if(isNYC){
        return {
            code: 0, // Inside NYC
            lat: result.geometry.location.lat,
            lon: result.geometry.location.lon,
            address: result.formatted_address
        };
    }
    else{
        return {
            code: 1, // outside NYC
            lat: result.geometry.location.lat,
            lon: result.geometry.location.lon,
            address: result.formatted_address
        };
    }
  } else {
    /** If the input is name or address **/
      const result = await getAddressFromName(input);
      if(result == null){
        return {
            code: 2, // Does not exist
            lat: null,
            lon: null,
            address: null
        }
      }
      const lat = result.location.latitude;
      const lon = result.location.longitude;
      const isNYC = result.addressComponents.some(c => 
      (c.types.includes("locality") || c.types.includes("sublocality")) && 
      ["New York", "Brooklyn", "The Bronx", "Queens", "Staten Island"].includes(c.longText)
      );
      if(isNYC){
        return {
            code: 0, // Inside NYC
            lat: lat,
            lon: lon,
            address: result.formatted_address
        }    
      } else{
        console.log(`Out of NYC`);
        console.log(result.formatted_address);
        return {
            code: 1, // Outside NYC
            lat: lat,
            lon: lon,
            address: result.formatted_address
        }
      }
  }
}

export{checkDestination};
