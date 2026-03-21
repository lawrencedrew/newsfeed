const assert = require('assert');
const { test } = require('node:test');
const { RedditAdapter } = require('../../app/sources/reddit');

test('RedditAdapter: normalizes reddit item to canonical shape', () => {
  const adapter = new RedditAdapter({ name: 'r/worldnews', config: { subreddit: 'worldnews' } });
  const raw = {
    id: 'abc123',
    title: 'Big news from somewhere',
    url: 'https://example.com',
    score: 1234,
    subreddit: 'worldnews',
    created_utc: 1700000000,
  };
  const item = adapter.normalize(raw);

  assert.strictEqual(item.sourceType, 'reddit');
  assert.strictEqual(item.sourceName, 'r/worldnews');
  assert.strictEqual(item.id, 'red-abc123');
  assert.strictEqual(item.title, 'Big news from somewhere');
  assert.deepStrictEqual(item.topics, ['worldnews']);
  assert.strictEqual(item.priority, 1, 'score > 500 should have priority 1');
  assert.deepStrictEqual(item.raw, raw);
});

test('RedditAdapter: handles missing subreddit in URL fallback', () => {
  const adapter = new RedditAdapter();
  const raw = { id: 'z', title: 'something', subreddit: 'news', created_utc: 1700000000 };
  const item = adapter.normalize(raw);
  assert.ok(item.url.includes('/r/news/'));
});
