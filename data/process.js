const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('raw.json', 'utf-8'));
const tracts = JSON.parse(fs.readFileSync('tracts.json', 'utf-8'));

const filteredTracts = tracts.features.filter((tract) => {
  return tract.properties.COUNTYFP === '031';
})

let finalTracts = {};

filteredTracts.forEach((tract) => {
  const geoid = tract.properties.GEOID;
  if (!finalTracts[geoid]) {
    finalTracts[geoid] = tract;
  } else {
    finalTracts[geoid].geometry.coordinates.push(tract.geometry.coordinates);
  }
});

let final = [];

//https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
const inside = (point, vs) => {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

  var x = point[0], y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

raw.features.forEach((feature, i) => {
  if ((i % 10 === 0 && i > 0) || i === raw.features.length - 1) {
    console.log(`Processing feature ${i} of ${raw.features.length} (${((i / raw.features.length) * 100).toFixed(2)}% done)`)
  };

  if (!feature.geometry?.coordinates) {
    console.log('No coordinates for feature', feature.properties);
    return false;
  }

  const tract = filteredTracts.find((tract) => {
    return inside(feature.geometry.coordinates, tract.geometry.coordinates.flat());
  });

  if (tract) {
    //console.log('Found tract for feature', tract.properties.GEOID)
    feature.properties.GEOID = tract.properties.GEOID;

    if (!finalTracts[tract.properties.GEOID].properties.count) {
      finalTracts[tract.properties.GEOID].properties.count = 0;
    }

    if (!finalTracts[tract.properties.GEOID].properties.types) {
      finalTracts[tract.properties.GEOID].properties.types = {};
    }

    if (!finalTracts[tract.properties.GEOID].properties.types[feature.properties.incident_primary]) {
      finalTracts[tract.properties.GEOID].properties.types[feature.properties.incident_primary] = 0;
    }

    finalTracts[tract.properties.GEOID].properties.count++;
    finalTracts[tract.properties.GEOID].properties.types[feature.properties.incident_primary]++;
  } else {
    console.warn('No tract found for feature', tract.properties.GEOID)
  }

  if (i === raw.features.length - 1) {
    fs.writeFileSync('final.json', JSON.stringify(finalTracts));
  }
});