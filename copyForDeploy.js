const fs = require('fs');

//recursively copy all files and folders from current folder into new 'dist' folder that are not raw.json or tracts.json
const copy = (src, dest) => {
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    if (file !== 'raw.json' && file !== 'tracts.json' && file !== 'dist') {
      if (fs.lstatSync(`${src}/${file}`).isDirectory()) {
        fs.mkdirSync(`${dest}/${file}`);
        copy(`${src}/${file}`, `${dest}/${file}`);
      } else {
        fs.copyFileSync(`${src}/${file}`, `${dest}/${file}`);
      }
    }
  });
};

if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

copy('.', 'dist');