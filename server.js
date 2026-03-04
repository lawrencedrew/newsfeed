const express = require('express');
const { loadConfig } = require('./src/config');

const config = loadConfig();
const app = express();

app.use(express.static('public'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`newsfeed running at http://localhost:${config.port}`);
});
