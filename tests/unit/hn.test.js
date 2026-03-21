const assert = require('assert');
const { test } = require('node:test');
const { normaliseHnItem } = require('../../app/sources/hn');

test('normalises HN item', () => {
  const raw = { id: 12345, title: 'Show HN: Cool thing', url: 'https://cool.com', score: 342, descendants: 88, time: 1700000000 };
  const item = normaliseHnItem(raw);
  assert.strictEqual(item.source, 'hn');
  assert.strictEqual(item.tag, '[HN]');
  assert.strictEqual(item.id, 'hn-12345');
  assert.ok(item.meta.includes('342'));
  assert.strictEqual(item.breaking, false);
  assert.ok(item.timestamp instanceof Date);
});

test('falls back to HN comment URL when no url field', () => {
  const raw = { id: 99, title: 'Ask HN: something', score: 10, descendants: 5, time: 1700000000 };
  const item = normaliseHnItem(raw);
  assert.ok(item.url.includes('99'));
});
