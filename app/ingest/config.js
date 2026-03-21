const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to load config from ${configPath}:`, err.message);
    process.exit(1);
  }
}

module.exports = { loadConfig };
