const assert = require('assert');
const { test } = require('node:test');
const { createItem } = require('../../app/models/item');

test('createItem: valid construction with full data', () => {
  const input = {
    id: '123',
    sourceType: 'rss',
    sourceName: 'BBC News',
    title: 'Test Title',
    body: 'Test Body',
    url: 'https://example.com',
    publishedAt: '2026-03-21T10:00:00Z',
    ingestedAt: '2026-03-21T11:00:00Z',
    symbols: ['$AAPL'],
    entities: ['Apple'],
    topics: ['finance'],
    priority: 5,
    sentiment: 0.8,
    duplicateGroup: 'dupe-abc',
    alerts: ['test-alert'],
    raw: { original: 'payload' }
  };

  const item = createItem(input);

  assert.strictEqual(item.id, '123');
  assert.strictEqual(item.sourceType, 'rss');
  assert.strictEqual(item.sourceName, 'BBC News');
  assert.strictEqual(item.title, 'Test Title');
  assert.strictEqual(item.body, 'Test Body');
  assert.strictEqual(item.url, 'https://example.com');
  assert.ok(item.publishedAt instanceof Date);
  assert.ok(item.ingestedAt instanceof Date);
  assert.strictEqual(item.publishedAt.toISOString(), '2026-03-21T10:00:00.000Z');
  assert.strictEqual(item.ingestedAt.toISOString(), '2026-03-21T11:00:00.000Z');
  assert.deepStrictEqual(item.symbols, ['$AAPL']);
  assert.deepStrictEqual(item.entities, ['Apple']);
  assert.deepStrictEqual(item.topics, ['finance']);
  assert.strictEqual(item.priority, 5);
  assert.strictEqual(item.sentiment, 0.8);
  assert.strictEqual(item.duplicateGroup, 'dupe-abc');
  assert.deepStrictEqual(item.alerts, ['test-alert']);
  assert.deepStrictEqual(item.raw, { original: 'payload' });
});

test('createItem: handles missing optional fields with defaults', () => {
  const item = createItem({});

  assert.strictEqual(item.id, '');
  assert.strictEqual(item.sourceType, 'unknown');
  assert.strictEqual(item.sourceName, 'unknown');
  assert.deepStrictEqual(item.symbols, []);
  assert.deepStrictEqual(item.entities, []);
  assert.deepStrictEqual(item.topics, []);
  assert.strictEqual(item.priority, 0);
  assert.strictEqual(item.sentiment, 0);
  assert.strictEqual(item.duplicateGroup, null);
  assert.deepStrictEqual(item.alerts, []);
  assert.deepStrictEqual(item.raw, {});
  assert.ok(item.publishedAt instanceof Date);
  assert.ok(item.ingestedAt instanceof Date);
});

test('createItem: handles invalid/missing timestamps deterministically', () => {
  const itemMissing = createItem({ publishedAt: null, ingestedAt: null });
  assert.ok(!isNaN(itemMissing.ingestedAt.getTime()));
  assert.strictEqual(itemMissing.publishedAt.getTime(), itemMissing.ingestedAt.getTime(), 'publishedAt should fallback to ingestedAt');

  const itemInvalid = createItem({ publishedAt: 'invalid date', ingestedAt: 'also invalid' });
  assert.ok(!isNaN(itemInvalid.ingestedAt.getTime()), 'ingestedAt should fallback to current time');
  assert.strictEqual(itemInvalid.publishedAt.getTime(), itemInvalid.ingestedAt.getTime(), 'publishedAt should fallback to ingestedAt');
});

test('createItem: preserves raw payload exactly', () => {
  const raw = { complex: { structure: true, list: [1, 2, 3] } };
  const item = createItem({ raw });
  assert.deepStrictEqual(item.raw, raw);
});

test('createItem: returned object is frozen', () => {
  const item = createItem({ id: 'immutable' });
  try {
    item.id = 'changed';
  } catch (e) {
    // Expected in strict mode or silently fails
  }
  assert.strictEqual(item.id, 'immutable');
});
