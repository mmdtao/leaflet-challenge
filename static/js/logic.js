// Week-to-Date US Earthquakes map
// Store API endpoints
var query = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var tectonics = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// GET request for earthquake data
d3.json(query).then(function (data) {
    // Console logged the retrieved data
    console.log(data);
    // Once we got a response, we sent the data.features object to the createFeatures function
    createFeatures(data.features);
});

// Created function to determine marker color depending on depth

function chooseColor(depth){
    // Create colors object in order to compare depth values
    const colorObj = {
        '#00FF00': depth <= 10,
        'greenyellow': depth > 10 && depth <= 30,
        'yellow': depth > 30 && depth <= 50,
        'orange': depth > 50 && depth <= 70,
        'orangered': depth > 70 && depth <= 90
    }
    // Performs an object search
    return Object.keys(colorObj).find(key => colorObj[key] == true) ?? "#FF0000"
}

function createFeatures(earthquakeData) {

  // Define a function that we want to run once for the features array
  // Give each feature a popup place and time info
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object
    var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,

    // Point to the layer used to alter markers
    pointToLayer: function(feature, latlng) {

      // Determine the style of markers
      var markers = {
        radius: feature.properties.mag * 20000,
        fillColor: chooseColor(feature.geometry.coordinates[2]),
        fillOpacity: 0.7,
        color: "black",
        weight: 0.5
      }
      return L.circle(latlng,markers);
    }
  });

  // Send earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Tile layers
  var street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

  
  var topo = new L.StamenTileLayer("terrain");

  var outdoors = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 20,
	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});

  var grey = new L.StamenTileLayer("toner-lite");

  var watercolor = new L.StamenTileLayer("watercolor");

  // Created a new layer for tectonic plates
  tectonicPlates = new L.layerGroup();

    // GET request of the tectonics URL
    d3.json(tectonics).then(function (plates) {

        // Console log the retrieved data
        console.log(plates);
        L.geoJSON(plates, {
            color: "orange",
            weight: 2
        }).addTo(tectonicPlates);
    });

    // Create a base map object
    var base = {
        "OpenStreet": street,
        "Topo": topo,
        "Outdoors": outdoors,
        "Grayscale": grey,
        "Watercolor": watercolor
    };

    // Create an overlay object to hold overlay
    var overlay = {
        "Earthquakes": earthquakes,
        "Tectonic Plates": tectonicPlates
    };
    
    // Create the map
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [street, earthquakes, tectonicPlates]
  });

// Create legend
var legend = L.control({position: "bottomright"});
legend.onAdd = function() {
  var div = L.DomUtil.create("div", "info legend"),
  depth = [-10, 10, 30, 50, 70, 90];

  div.innerHTML += "<h3 style='text-align: center'>Depth</h3>"

  for (var i = 0; i < depth.length; i++) {
    div.innerHTML +=
    '<i style="background:' + chooseColor(depth[i] + 1) + '"></i> ' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
  }
  return div;
};
legend.addTo(myMap)

  // Create a layer control and pass it to the base and overlay maps
  // Add layer control to the map
  L.control.layers(base, overlay, {
    collapsed: false
  }).addTo(myMap);
};