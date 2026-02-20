const apiKey = ''; 
const address = 'EmpireStatesBuilding,NY';

async function getGeo() {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log("result:", data.results[0].geometry.location);
    } else {
      console.log("API error:", data.status);
      console.log("message:", data.error_message || "none");
    }
  } catch (err) {
    console.error("network error:", err.message);
  }
}

getGeo();