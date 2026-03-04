const assert = require('assert');
const { test } = require('node:test');
const { normaliseRssItem } = require('../src/pollers/rss');

test('normalises rss item to feed item shape', () => {
  const raw = {
    title: 'Test headline',
    link: 'https://example.com/story',
    pubDate: 'Mon, 03 Mar 2026 14:00:00 GMT',
    content: 'Story body text',
  };
  const item = normaliseRssItem(raw, 'rss');
  assert.strictEqual(item.title, 'Test headline');
  assert.strictEqual(item.url, 'https://example.com/story');
  assert.strictEqual(item.source, 'rss');
  assert.strictEqual(item.tag, '[RSS]');
  assert.ok(item.id);
  assert.ok(item.timestamp instanceof Date);
});

test('marks item as breaking if title contains "breaking"', () => {
  const raw = { title: 'BREAKING: Big news', link: 'https://x.com', pubDate: new Date().toUTCString() };
  const item = normaliseRssItem(raw, 'rss');
  assert.strictEqual(item.breaking, true);
});

test('nitter items get [TWX] tag', () => {
  const raw = { title: 'Some tweet', link: 'https://nitter.net/user/1', pubDate: new Date().toUTCString() };
  const item = normaliseRssItem(raw, 'nitter');
  assert.strictEqual(item.tag, '[TWX]');
  assert.strictEqual(item.source, 'nitter');
});
