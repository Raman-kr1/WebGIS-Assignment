// Keep these variables in global scope so we can reset styles after a search.
let geojsonLayer = null;
let highlightLayer = null;

// Dictionary to store each state's layer: { 'punjab': LeafletLayer, 'bihar': LeafletLayer, ... }
const stateLayerMap = {};

// Initialize the Leaflet map (center on India).
const map = L.map('map').setView([23.0, 82.0], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

/**
 * Populate a list of 5 random states in the sidebar, showing dummy populations.
 */
function populateRandomStatesList(features) {
  const listEl = document.getElementById('randomStatesList');
  listEl.innerHTML = '';

  // We assume the property is NAME_1 for each state's name. Adjust if yours is ST_NM, etc.
  const allStateNames = features.map(f => f.properties.NAME_1.trim());
  
  const sample = [];
  const count = Math.min(5, allStateNames.length);
  for (let i = 0; i < count; i++) {
    const randIdx = Math.floor(Math.random() * allStateNames.length);
    const picked = allStateNames.splice(randIdx, 1)[0];
    sample.push(picked);
  }

  sample.forEach(name => {
    // 'name' might be "Punjab"
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

// Load the India states GeoJSON from the 'data' folder
fetch('data/india_states.geojson')
  .then(resp => resp.json())
  .then(data => {
    // Assign a dummy population for each state
    data.features.forEach(feature => {
      feature.properties.population = Math.floor(Math.random() * (100_000_000 - 1_000_000 + 1)) + 1_000_000;
    });

    // Create the Leaflet GeoJSON layer
    geojsonLayer = L.geoJSON(data, {
      style: { color: '#3388ff', weight: 1, fillOpacity: 0.2 },
      onEachFeature: (feature, layer) => {
        // Debug: see all properties in the console
        console.log("Feature properties:", feature.properties);

        // Attempt to use NAME_1 as the state name
        const rawName = feature.properties.NAME_1;
        if (rawName) {
          const stateName = rawName.trim(); // remove extra spaces
          layer.bindPopup(stateName);

          // Store the layer under a lowercase key so searches are case-insensitive
          stateLayerMap[stateName.toLowerCase()] = layer;
        } else {
          console.warn("No NAME_1 found for this feature:", feature);
        }
      }
    }).addTo(map);

    // Fit the map to show all states
    map.fitBounds(geojsonLayer.getBounds());

    // Update sidebar: show total count
    document.getElementById('totalStates').textContent = data.features.length;

    // Populate 5 random states in the sidebar
    populateRandomStatesList(data.features);

    // Debug: check which keys we have in the dictionary
    console.log("stateLayerMap keys:", Object.keys(stateLayerMap));
  })
  .catch(err => console.error("Error loading GeoJSON data:", err));

// Search functionality
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchResult = document.getElementById('searchResult');

searchForm.addEventListener('submit', event => {
  event.preventDefault();

  // Grab the search text, e.g. "punjab"
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  // Reset previously highlighted state
  if (highlightLayer && geojsonLayer) {
    geojsonLayer.resetStyle(highlightLayer);
    map.closePopup();
    highlightLayer = null;
  }

  // Look up the layer in our dictionary
  const layer = stateLayerMap[query];
  if (layer) {
    // Highlight style
    layer.setStyle({ color: 'yellow', weight: 3 });
    layer.openPopup(); // show the name popup
    highlightLayer = layer;

    // Zoom to the selected state's bounds
    map.fitBounds(layer.getBounds());

    // Update sidebar with the state's info
    const rawName = layer.feature.properties.NAME_1.trim();
    const pop = layer.feature.properties.population;
    searchResult.textContent = `${rawName} – Population: ${pop.toLocaleString()}`;
  } else {
    // No match
    searchResult.textContent = "State not found. Please check the name and try again.";
  }
});
