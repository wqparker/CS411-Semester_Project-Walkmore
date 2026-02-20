const apiKey = '';
const url = 'https://places.googleapis.com/v1/places:searchText';

const data = {
  textQuery: "Empire States Building, NY"
};

const headers = {
  'Content-Type': 'application/json',
  'X-Goog-Api-Key': apiKey,
  //Mask allows to filter data from response.
  'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.websiteUri,places.location'
};

async function getPlaces() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

getPlaces();