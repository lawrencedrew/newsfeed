const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

module.exports = { loadConfig };
