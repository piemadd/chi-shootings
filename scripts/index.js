let currentStyle = 'light';

//https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

var map = new maplibregl.Map({
  container: "map",
  hash: true,
  attributionControl: false,
  refreshExpiredTiles: false,
  style: {
    id: "43f36e14-e3f5-43c1-84c0-50a9c80dc5c7",
    name: "MapLibre",
    zoom: 0,
    pitch: 0,
    center: [-87.6062, 41.9087],
    glyphs:
      "https://cdn.jsdelivr.net/gh/piemadd/fonts@54b954f510dc79e04ae47068c5c1f2ee39a69216/_output/{fontstack}/{range}.pbf",
    layers: mapThemes[currentStyle],
    bearing: 0,
    sources: {
      protomaps: {
        type: "vector",
        tiles: [
          "https://tilea.piemadd.com/tiles/{z}/{x}/{y}.mvt",
          "https://tileb.piemadd.com/tiles/{z}/{x}/{y}.mvt",
          "https://tilec.piemadd.com/tiles/{z}/{x}/{y}.mvt",
          "https://tiled.piemadd.com/tiles/{z}/{x}/{y}.mvt",
          //"http://10.0.0.237:8081/tiles/{z}/{x}/{y}.mvt"
        ],
        maxzoom: 13,
      },
    },
    version: 8,
    metadata: {},
  }, // stylesheet location
  center: [-87.6062, 41.9087], // starting position [lng, lat]
  zoom: 10, // starting zoom
});
map.on("load", () => {
  console.log('loaded')

  fetch('/data/final.json')
    .then((response) => response.json())
    .then((data) => {
      const maxCrimeCount = Object.values(data).reduce((max, tract) => {
        return tract.properties.count > max ? tract.properties.count : max;
      }, 0);

      Object.values(data).forEach((tract) => {
        if (!tract.properties.count) {
          tract.properties.count = 0;
        }

        if (!tract.properties.types) {
          tract.properties.types = {};
        };

        //tract.properties.types = JSON.parse(tract.properties.types);
      });

      map.addSource('crime-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: Object.values(data),
        },
      });

      map.addLayer({
        id: 'crime-data',
        source: 'crime-data',
        type: 'fill',
        'paint': {
          'fill-color': {
            property: 'count',
            stops: [
              [0, '#ffffff'],
              [maxCrimeCount, '#ff0000']
            ]
          },
          'fill-opacity': 0.5,
          'fill-outline-color': '#000000',
        }
      });

      map.on('click', 'crime-data', (e) => {
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
          <h3>Tract ${e.features[0].properties.TRACTCE}</h3>
          <h4>Crimes:</h4>
          <ul>
            ${Object.entries(JSON.parse(e.features[0].properties.types)).map(([crime, count]) => {
            return `<li>${toTitleCase(crime)}: ${count}</li>`;
          }).join('')}
            <li>Total: ${e.features[0].properties.count}</li>
          </ul>
          `)
          .addTo(map);
      });

      // Change the cursor to a pointer when the mouse is over the states layer.
      map.on('mouseenter', 'states-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      map.on('mouseleave', 'states-layer', () => {
        map.getCanvas().style.cursor = '';
      });

      console.log('added source')
    });
});