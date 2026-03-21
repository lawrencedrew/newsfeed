const assert = require('assert');
const { test } = require('node:test');
const { HnAdapter } = require('../../app/sources/hn');

test('HnAdapter: normalizes HN item to canonical shape', () => {
  const adapter = new HnAdapter({ name: 'HN', config: { feed: 'top' } });
  const raw = { id: 12345, title: 'Show HN: Cool thing', url: 'https://cool.com', score: 342, time: 1700000000 };
  const item = adapter.normalize(raw);

  assert.strictEqual(item.sourceType, 'hn');
  assert.strictEqual(item.id, 'hn-12345');
  assert.strictEqual(item.title, 'Show HN: Cool thing');
  assert.strictEqual(item.url, 'https://cool.com');
  assert.ok(item.publishedAt instanceof Date);
  assert.strictEqual(item.priority, 1, 'score > 100 should have priority 1');
  assert.deepStrictEqual(item.raw, raw);
});

test('HnAdapter: falls back to HN comment URL when no url field', () => {
  const adapter = new HnAdapter();
  const raw = { id: 99, title: 'Ask HN: something', score: 10, time: 1700000000 };
  const item = adapter.normalize(raw);
  assert.ok(item.url.includes('99'));
});
