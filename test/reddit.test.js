const assert = require('assert');
const { test } = require('node:test');
const { normaliseRedditItem } = require('../src/pollers/reddit');

test('normalises reddit item', () => {
  const raw = {
    data: {
      id: 'abc123',
      title: 'Big news from somewhere',
      url: 'https://example.com',
      score: 1234,
      subreddit: 'worldnews',
      created_utc: 1700000000,
    }
  };
  const item = normaliseRedditItem(raw);
  assert.strictEqual(item.source, 'reddit');
  assert.strictEqual(item.tag, '[RED]');
  assert.strictEqual(item.id, 'red-abc123');
  assert.ok(item.meta.includes('1.2k'));
  assert.ok(item.meta.includes('worldnews'));
});

test('marks item as breaking if title contains breaking', () => {
  const raw = {
    data: { id: 'z', title: 'BREAKING: something happened', url: 'https://x.com', score: 0, subreddit: 'news', created_utc: 1700000000 }
  };
  const item = normaliseRedditItem(raw);
  assert.strictEqual(item.breaking, true);
});
