// Initialize the map
const map = L.map('map').setView([20.5937, 78.9629], 5);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables to store GeoJSON layer and state data
let statesLayer;
let statesData = [];
let statePopulation = {};

// Function to generate random population data
function generatePopulationData(features) {
    const populationData = {};
    features.forEach(feature => {
        const stateName = feature.properties.NAME_1;
        // Generate random population between 1M and 100M
        populationData[stateName] = Math.floor(Math.random() * 99000000) + 1000000;
    });
    return populationData;
}

// Function to display random states
function displayRandomStates(states, count = 5) {
    const randomStatesList = document.getElementById('random-states-list');
    randomStatesList.innerHTML = '';
    
    // Shuffle array and get first 'count' elements
    const shuffled = [...states].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    selected.forEach(state => {
        const li = document.createElement('li');
        li.textContent = `${state} - Population: ${statePopulation[state].toLocaleString()}`;
        randomStatesList.appendChild(li);
    });
}

// Function to highlight a state on the map
function highlightState(stateName) {
    statesLayer.resetStyle();
    statesLayer.eachLayer(layer => {
        if (layer.feature.properties.NAME_1 === stateName) {
            layer.setStyle({
                fillColor: 'red',
                fillOpacity: 0.7,
                weight: 2,
                color: 'red'
            });
            
            // Zoom to the state with some padding
            map.fitBounds(layer.getBounds(), { padding: [50, 50] });
            
            // Display state info in sidebar
            const stateInfo = document.getElementById('state-info');
            stateInfo.innerHTML = `
                <h4>${stateName}</h4>
                <p>Population: ${statePopulation[stateName].toLocaleString()}</p>
            `;
        }
    });
}

// Load GeoJSON data
fetch('data/india_states.geojson')
    .then(response => response.json())
    .then(data => {
        statesData = data.features;
        statePopulation = generatePopulationData(statesData);
        
        // Update total states count
        document.getElementById('total-states').textContent = statesData.length;
        
        // Display random states
        const stateNames = statesData.map(f => f.properties.NAME_1);
        displayRandomStates(stateNames);
        
        // Add GeoJSON to map
        statesLayer = L.geoJSON(data, {
            style: {
                fillColor: 'blue',
                weight: 1,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.3
            },
            onEachFeature: function(feature, layer) {
                const stateName = feature.properties.NAME_1;
                layer.bindPopup(`<b>${stateName}</b><br>Population: ${statePopulation[stateName].toLocaleString()}`);
                
                layer.on({
                    mouseover: function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            fillColor: 'green',
                            fillOpacity: 0.7,
                            weight: 2
                        });
                    },
                    mouseout: function(e) {
                        statesLayer.resetStyle();
                    },
                    click: function(e) {
                        highlightState(stateName);
                    }
                });
            }
        }).addTo(map);
        
        // Fit map to India bounds
        map.fitBounds(statesLayer.getBounds());
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Search functionality
document.getElementById('search-btn').addEventListener('click', function() {
    const searchInput = document.getElementById('search-input').value.trim();
    if (searchInput) {
        const foundState = statesData.find(f => 
            f.properties.NAME_1.toLowerCase().includes(searchInput.toLowerCase())
        );
        
        if (foundState) {
            highlightState(foundState.properties.NAME_1);
        } else {
            alert('State not found!');
        }
    }
});

// Allow search on Enter key
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});