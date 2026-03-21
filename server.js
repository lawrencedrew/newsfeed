const express = require('express');
const { loadConfig } = require('./app/ingest/config');
const { Store } = require('./app/storage/store');
const { pollRss, pollNitter } = require('./app/sources/rss');
const { pollHn } = require('./app/sources/hn');
const { pollReddit } = require('./app/sources/reddit');

const config = loadConfig();
const store = new Store(config.maxItems);
const app = express();

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

  req.on('close', () => {
    unsub();
  });
});

app.get('/refresh', async (req, res) => {
  await pollAll();
  res.json({ ok: true });
});

app.use(express.static('app/tui'));

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
