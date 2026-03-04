const express = require('express');
const { loadConfig } = require('./src/config');
const { Store } = require('./src/store');
const { pollRss, pollNitter } = require('./src/pollers/rss');
const { pollHn } = require('./src/pollers/hn');
const { pollReddit } = require('./src/pollers/reddit');

const config = loadConfig();
const store = new Store(config.maxItems);
const app = express();
const clients = new Set();

// --- SSE endpoint ---
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send all existing items on connect
  const items = store.getAll();
  res.write(`data: ${JSON.stringify({ type: 'snapshot', items })}\n\n`);

  const send = item => res.write(`data: ${JSON.stringify({ type: 'item', item })}\n\n`);
  const unsub = store.onNew(send);
  clients.add(send);

  req.on('close', () => {
    clients.delete(send);
    unsub();
  });
});

app.get('/refresh', async (req, res) => {
  await pollAll();
  res.json({ ok: true });
});

app.use(express.static('public'));

// --- Polling ---
async function pollAll() {
  console.log(`[poll] ${new Date().toISOString()}`);
  await Promise.allSettled([
    pollRss(config.rss, store),
    pollNitter(config.nitter, store),
    pollHn(config.hackernews, store),
    pollReddit(config.reddit, store),
  ]);
}

pollAll();
setInterval(pollAll, config.pollIntervalSecs * 1000);

app.listen(config.port, () => {
  console.log(`newsfeed running at http://localhost:${config.port}`);
});
