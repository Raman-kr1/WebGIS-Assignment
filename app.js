// variables in global scope, for reset style after a search.
let geojsonLayer = null;
let highlightLayer = null;

// Dictionary to store each state's layer
const stateLayerMap = {};

// Leaflet map -center on India
const map = L.map('map').setView([23.0, 82.0], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// Random population of 5 state (dummy)
function populateRandomStatesList(features) {
  const listEl = document.getElementById('randomStatesList');
  listEl.innerHTML = '';

  // property is NAME_1 for each state. Adjust if ST_NM , etc.
  const allStateNames = features.map(f => f.properties.NAME_1.trim());
  
  const sample = [];
  const count = Math.min(5, allStateNames.length);
  for (let i = 0; i < count; i++) {
    const randIdx = Math.floor(Math.random() * allStateNames.length);
    const picked = allStateNames.splice(randIdx, 1)[0];
    sample.push(picked);
  }

  sample.forEach(name => {

    const layer = stateLayerMap[name.toLowerCase()];
    if (!layer) {
      console.warn("No layer found for random sample:", name);
      return;
    }
    const pop = layer.feature.properties.population;
    const li = document.createElement('li');
    li.textContent = `${name} – Pop. ${pop.toLocaleString()}`;
    listEl.appendChild(li);
  });
}

// Loading the data of India states GeoJSON
fetch('data/india_states.geojson')
  .then(resp => resp.json())
  .then(data => {
   
    data.features.forEach(feature => {
      feature.properties.population = Math.floor(Math.random() * (100_000_000 - 1_000_000 + 1)) + 1_000_000;
    });

    // Creating the Leaflet GeoJSON layer
    geojsonLayer = L.geoJSON(data, {
      style: { color: '#3388ff', weight: 1, fillOpacity: 0.2 },
      onEachFeature: (feature, layer) => {
        // Debug: see all properties in the console
        console.log("Feature properties:", feature.properties);

        // NAME_1 as the state name
        const rawName = feature.properties.NAME_1;
        if (rawName) {
          const stateName = rawName.trim(); //  extra spaces triming
          layer.bindPopup(stateName);

          
          stateLayerMap[stateName.toLowerCase()] = layer;
        } else {
          console.warn("No NAME_1 found for this feature:", feature);
        }
      }
    }).addTo(map);

    // set the map of all ststtes
    map.fitBounds(geojsonLayer.getBounds());

    // Update sideba and show total cnt
    document.getElementById('totalStates').textContent = data.features.length;

    // display rndm 5 state pop.
    populateRandomStatesList(data.features);

    // Debug: check for which keys is in the dictionary
    console.log("stateLayerMap keys:", Object.keys(stateLayerMap));
  })
  .catch(err => console.error("Error loading GeoJSON data:", err));

// Search functionality
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchResult = document.getElementById('searchResult');

searchForm.addEventListener('submit', event => {
  event.preventDefault();

  
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  // Reset old search
  if (highlightLayer && geojsonLayer) {
    geojsonLayer.resetStyle(highlightLayer);
    map.closePopup();
    highlightLayer = null;
  }

  
  const layer = stateLayerMap[query];
  if (layer) {
    
    layer.setStyle({ color: 'yellow', weight: 3 });
    layer.openPopup(); 
    highlightLayer = layer;

  
    map.fitBounds(layer.getBounds());

    //  sidebar updatewd
    const rawName = layer.feature.properties.NAME_1.trim();
    const pop = layer.feature.properties.population;
    searchResult.textContent = `${rawName} – Population: ${pop.toLocaleString()}`;
  } else {
    
    searchResult.textContent = "State not found. Please check the name and try again.";
  }
});
