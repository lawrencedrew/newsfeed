const assert = require('assert');
const { test, mock } = require('node:test');
const { Store } = require('../../app/storage/store');
const { ScoringEngine } = require('../../app/scoring/engine');
const { AlertsEngine } = require('../../app/alerts/engine');
const { HnAdapter } = require('../../app/sources/hn');
const { RedditAdapter } = require('../../app/sources/reddit');
const { RssAdapter } = require('../../app/sources/rss');
const { TelegramAdapter } = require('../../app/sources/telegram');
const { FinanceAdapter } = require('../../app/sources/finance');
const RSSParser = require('rss-parser');

test('Pipeline: Full end-to-end integration for all 5 source types', async () => {
  // 1. Setup Infrastructure
  const store = new Store(50);
  const scorer = new ScoringEngine({
    watchwords: { 'CRITICAL': 1000, 'MARKET': 100 },
    sourceWeights: { 'hn': 10 }
  });
  const alerts = new AlertsEngine([
    { id: 'ALERT-CRITICAL', keywords: ['CRITICAL'] }
  ]);
  store.setScorer(scorer);
  store.setAlertsEngine(alerts);

  // 2. Mock Network Layer
  const originalFetch = global.fetch;
  global.fetch = mock.fn(async (url) => {
    if (url.includes('hacker-news')) {
      if (url.endsWith('stories.json')) return { ok: true, json: async () => [1] };
      if (url.includes('item/1.json')) return { ok: true, json: async () => ({ id: 1, type: 'story', title: 'HN Story', score: 200, time: 1700000000 }) };
    }
    if (url.includes('reddit.com')) {
      return { ok: true, json: async () => ({ data: { children: [{ data: { id: 'r1', title: 'Reddit Post', subreddit: 'news', created_utc: 1700000000, score: 600 } }] } }) };
    }
    return { ok: false };
  });

  const mockParseURL = mock.method(RSSParser.prototype, 'parseURL', async (url) => {
    if (url.includes('feeds.bbci.co.uk')) {
      return { items: [{ guid: 'rss-item-1', title: 'RSS News', link: 'http://rss-link', pubDate: '2026-03-21T10:00:00Z' }] };
    }
    if (url.includes('rsshub.app')) {
      return { items: [{ guid: 'https://t.me/tele/msg1', contentSnippet: 'Telegram CRITICAL message', isoDate: '2026-03-21T11:00:00Z' }] };
    }
    if (url.includes('finance.example')) {
      return { items: [{ guid: 'fin-item-1', title: 'MARKET update $AAPL', isoDate: '2026-03-21T12:00:00Z' }] };
    }
    return { items: [] };
  });

  // 3. Initialize Adapters
  const adapters = [
    new HnAdapter({ config: { feed: 'top', limit: 1 } }),
    new RedditAdapter({ config: { subreddit: 'news', limit: 1 } }),
    new RssAdapter({ config: { url: 'https://feeds.bbci.co.uk/news/rss.xml' } }),
    new TelegramAdapter({ config: { channel: 'tele', bridge: 'https://rsshub.app/telegram/channel' } }),
    new FinanceAdapter({ config: { url: 'https://finance.example.com/rss', sourceKey: 'mkt' } })
  ];

  // 4. Execute Pipeline
  for (const adapter of adapters) {
    const items = await adapter.poll();
    // console.log(`[Test] Adapter ${adapter.type} polled ${items.length} items`);
    for (const item of items) {
      store.add(item);
    }
  }

  // 5. Assertions
  const ranked = store.getRanked();

  // All 5 sources present?
  assert.strictEqual(ranked.length, 5, 'Should have exactly 5 items from 5 sources');
  
  const sources = new Set(ranked.map(i => i.sourceType));
  assert.ok(sources.has('hn'), 'Missing HN');
  assert.ok(sources.has('reddit'), 'Missing Reddit');
  assert.ok(sources.has('rss'), 'Missing RSS');
  assert.ok(sources.has('telegram'), 'Missing Telegram');
  assert.ok(sources.has('finance'), 'Missing Finance');

  // Priority Check: Telegram item has 'CRITICAL' watchword (+1000)
  assert.strictEqual(ranked[0].sourceType, 'telegram', 'Telegram should be top ranked');
  assert.ok(ranked[0].priority >= 1000, 'Telegram item priority missing bonus');
  assert.deepStrictEqual(ranked[0].alerts, ['ALERT-CRITICAL'], 'Telegram item missing alert');

  // Priority Check: Finance item has 'MARKET' (+100)
  const finItem = ranked.find(i => i.sourceType === 'finance');
  assert.ok(finItem.priority >= 100, 'Finance item priority missing bonus');
  assert.deepStrictEqual(finItem.symbols, ['AAPL'], 'Finance item missing symbols');

  // Cleanup
  global.fetch = originalFetch;
  mockParseURL.mock.restore();
});
