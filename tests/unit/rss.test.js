const assert = require('assert');
const { test } = require('node:test');
const { RssAdapter } = require('../../app/sources/rss');

test('RssAdapter: normalizes rss item to canonical shape', () => {
  const adapter = new RssAdapter({ name: 'BBC News', type: 'rss' });
  const raw = {
    title: 'Test headline',
    link: 'https://example.com/story',
    pubDate: 'Mon, 03 Mar 2026 14:00:00 GMT',
    content: 'Story body text',
  };
  const item = adapter.normalize(raw);

  assert.strictEqual(item.title, 'Test headline');
  assert.strictEqual(item.url, 'https://example.com/story');
  assert.strictEqual(item.sourceType, 'rss');
  assert.strictEqual(item.sourceName, 'BBC News');
  assert.ok(item.id);
  assert.ok(item.publishedAt instanceof Date);
  assert.deepStrictEqual(item.raw, raw);
});

test('RssAdapter: handles nitter source type', () => {
  const adapter = new RssAdapter({ name: 'Twitter', type: 'nitter' });
  const raw = { title: 'Some tweet', link: 'https://nitter.net/user/1', pubDate: new Date().toUTCString() };
  const item = adapter.normalize(raw);
  assert.strictEqual(item.sourceType, 'nitter');
  assert.strictEqual(item.sourceName, 'Twitter');
});
