const assert = require('assert');
const { test } = require('node:test');
const { Store } = require('../../app/storage/store');
const { createItem } = require('../../app/models/item');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'test-persistence.db');

test('TC-01: Durability & Restart', () => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const item = createItem({
    id: 'test-1',
    title: 'Durable Title',
    priority: 75,
    alerts: ['CRITICAL'],
    publishedAt: new Date('2026-03-21T12:00:00Z')
  });

  // 1. Add item to first instance
  const store1 = new Store(10, { dbPath: DB_PATH });
  const added = store1.add(item);
  assert.strictEqual(added, true);
  
  // Close or just nullify reference - better-sqlite3 handles sync writes
  
  // 2. Restore in second instance
  const store2 = new Store(10, { dbPath: DB_PATH });
  const items = store2.getAll();
  
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].id, 'test-1');
  assert.strictEqual(items[0].title, 'Durable Title');
  assert.strictEqual(items[0].priority, 75);
  assert.deepStrictEqual(items[0].alerts, ['CRITICAL']);
  assert.strictEqual(items[0].publishedAt.toISOString(), '2026-03-21T12:00:00.000Z');

  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

test('TC-02: Deduplication', () => {
  const store = new Store(10, { dbPath: ':memory:' });
  const item = createItem({ id: 'dup-1', title: 'Original' });
  
  store.add(item);
  const result = store.add(createItem({ id: 'dup-1', title: 'Duplicate' }));
  
  assert.strictEqual(result, false, 'Should return false for duplicate ID');
  const items = store.getAll();
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].title, 'Original', 'Should not update existing record');
});
