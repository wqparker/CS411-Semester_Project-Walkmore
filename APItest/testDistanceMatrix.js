const apiKey = ''; 
const address = 'EmpireStatesBuilding,NY';

async function getGeo() {

  const origins = '37.419,-122.082';     
  const destinations = '37.417,-122.079';
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}&mode=walking`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log("result:", data.rows[0].elements[0]);
    } else {
      console.log("API error:", data.status);
      console.log("message:", data.error_message || "none");
    }
  } catch (err) {
    console.error("network error:", err.message);
  }
}

getGeo();