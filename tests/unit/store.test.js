const assert = require('assert');
const { test } = require('node:test');
const { Store } = require('../../app/storage/store');

test('adds items and retrieves them in reverse-chron order', () => {
  const store = new Store(500);
  store.add({ id: '1', timestamp: new Date('2026-01-01T10:00:00Z'), title: 'A' });
  store.add({ id: '2', timestamp: new Date('2026-01-01T11:00:00Z'), title: 'B' });
  const items = store.getAll();
  assert.strictEqual(items[0].title, 'B');
  assert.strictEqual(items[1].title, 'A');
});

test('deduplicates by id', () => {
  const store = new Store(500);
  store.add({ id: 'x', timestamp: new Date(), title: 'First' });
  store.add({ id: 'x', timestamp: new Date(), title: 'Duplicate' });
  assert.strictEqual(store.getAll().length, 1);
});

test('caps at maxItems', () => {
  const store = new Store(3);
  for (let i = 0; i < 5; i++) {
    store.add({ id: String(i), timestamp: new Date(), title: `Item ${i}` });
  }
  assert.strictEqual(store.getAll().length, 3);
});
