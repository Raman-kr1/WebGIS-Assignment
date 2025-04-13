// Initialize the map
const map = L.map('map').setView([21.5937, 78.9629], 5);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables to store GeoJSON layer and state data
let statesLayer;
let statesData = [];
let statePopulation = {};

// Fetch GeoJSON data
fetch('data/india_states.geojson')
    .then(response => response.json())
    .then(data => {
        statesData = data.features;
        
        // Generate random population data
        statesData.forEach(state => {
            const stateName = state.properties.NAME_1;
            statePopulation[stateName] = Math.floor(Math.random() * 50000000) + 1000000;
        });
        
        // Add states to map
        statesLayer = L.geoJSON(data, {
            style: {
                fillColor: '#4CAF50',
                weight: 1,
                opacity: 1,
                color: '#388E3C',
                fillOpacity: 0.7
            },
            onEachFeature: onEachFeature
        }).addTo(map);
        
        // Update UI with total states
        document.getElementById('total-states').textContent = statesData.length;
        
        // Show 5 random states
        showRandomStates();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Function to handle each feature in GeoJSON
function onEachFeature(feature, layer) {
    const stateName = feature.properties.NAME_1;
    
    // Add popup with state name
    layer.bindPopup(`<b>${stateName}</b>`);
    
    // Add click event to show state info in sidebar
    layer.on('click', function() {
        showStateInfo(stateName);
    });
}

// Function to show state info in sidebar
function showStateInfo(stateName) {
    const stateInfoDiv = document.getElementById('state-info');
    stateInfoDiv.innerHTML = `
        <p><strong>State:</strong> ${stateName}</p>
        <p><strong>Population:</strong> ${statePopulation[stateName].toLocaleString()}</p>
    `;
    
    // Highlight the state on the map
    resetStateStyles();
    highlightState(stateName);
}

// Function to highlight a state
function highlightState(stateName) {
    statesLayer.eachLayer(function(layer) {
        if (layer.feature.properties.NAME_1 === stateName) {
            layer.setStyle({
                fillColor: '#FF5722',
                fillOpacity: 0.7,
                color: '#E64A19',
                weight: 2
            });
        }
    });
}

// Function to reset all state styles
function resetStateStyles() {
    statesLayer.setStyle({
        fillColor: '#4CAF50',
        weight: 1,
        opacity: 1,
        color: '#388E3C',
        fillOpacity: 0.7
    });
}

// Function to show 5 random states in sidebar
function showRandomStates() {
    const randomStatesList = document.getElementById('random-states');
    randomStatesList.innerHTML = '';
    
    // Get 5 random states
    const shuffled = [...statesData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    // Add to list
    selected.forEach(state => {
        const stateName = state.properties.NAME_1;
        const li = document.createElement('li');
        li.innerHTML = `${stateName} <span class="population">(${statePopulation[stateName].toLocaleString()})</span>`;
        li.addEventListener('click', () => showStateInfo(stateName));
        randomStatesList.appendChild(li);
    });
}

// Search functionality
document.getElementById('search-button').addEventListener('click', function() {
    const searchInput = document.getElementById('search-input').value.trim();
    if (!searchInput) return;
    
    // Find state (case insensitive)
    const foundState = statesData.find(state => 
        state.properties.NAME_1.toLowerCase().includes(searchInput.toLowerCase())
    );
    
    if (foundState) {
        const stateName = foundState.properties.NAME_1;
        showStateInfo(stateName);
        
        // Zoom to the state
        const bounds = L.geoJSON(foundState).getBounds();
        map.fitBounds(bounds);
    } else {
        document.getElementById('state-info').innerHTML = 
            '<p>State not found. Please try another name.</p>';
        resetStateStyles();
    }
});

// Allow search on Enter key
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('search-button').click();
    }
});