const assert = require('assert');
const { test } = require('node:test');
const { Store } = require('../../app/storage/store');
const { createItem } = require('../../app/models/item');

test('adds items and retrieves them in reverse-chron order', () => {
  const store = new Store(10);
  store.add(createItem({ id: '1', publishedAt: new Date('2026-01-01T10:00:00Z'), title: 'A' }));
  store.add(createItem({ id: '2', publishedAt: new Date('2026-01-01T11:00:00Z'), title: 'B' }));
  const items = store.getAll();
  assert.strictEqual(items[0].title, 'B');
  assert.strictEqual(items[1].title, 'A');
});

test('deduplicates by id', () => {
  const store = new Store(10);
  store.add(createItem({ id: 'x', publishedAt: new Date(), title: 'First' }));
  store.add(createItem({ id: 'x', publishedAt: new Date(), title: 'Duplicate' }));
  assert.strictEqual(store.getAll().length, 1);
});

test('batch adds multiple items', () => {
  const store = new Store(10);
  const items = [
    createItem({ id: '1', publishedAt: new Date('2026-01-01T10:00:00Z'), title: '1' }),
    createItem({ id: '2', publishedAt: new Date('2026-01-01T11:00:00Z'), title: '2' }),
    createItem({ id: '1', publishedAt: new Date('2026-01-01T10:00:00Z'), title: '1' }), // Duplicate
  ];
  const count = store.addMany(items);
  assert.strictEqual(count, 2);
  assert.strictEqual(store.getAll().length, 2);
});

test('filters by sourceType and sourceName', () => {
  const store = new Store(10);
  store.add(createItem({ id: '1', sourceType: 'rss', sourceName: 'BBC', publishedAt: new Date() }));
  store.add(createItem({ id: '2', sourceType: 'hn', sourceName: 'HN', publishedAt: new Date() }));
  store.add(createItem({ id: '3', sourceType: 'rss', sourceName: 'CNN', publishedAt: new Date() }));

  assert.strictEqual(store.filterBySourceType('rss').length, 2);
  assert.strictEqual(store.filterBySourceType('hn').length, 1);
  assert.strictEqual(store.filterBySourceName('BBC').length, 1);
  assert.strictEqual(store.filterBySourceName('Unknown').length, 0);
});

test('enforces capacity and evicts oldest items', () => {
  const store = new Store(3);
  store.add(createItem({ id: 'oldest', publishedAt: new Date('2026-01-01T08:00:00Z'), title: 'oldest' }));
  store.add(createItem({ id: 'mid', publishedAt: new Date('2026-01-01T09:00:00Z'), title: 'mid' }));
  store.add(createItem({ id: 'newest', publishedAt: new Date('2026-01-01T10:00:00Z'), title: 'newest' }));

  // Add 4th item, should evict 'oldest'
  store.add(createItem({ id: 'extra', publishedAt: new Date('2026-01-01T11:00:00Z'), title: 'extra' }));

  const items = store.getAll();
  assert.strictEqual(items.length, 3);
  assert.ok(!items.find(i => i.id === 'oldest'), 'oldest should have been evicted');
  assert.strictEqual(items[0].id, 'extra');
  assert.strictEqual(items[2].id, 'mid');
});

test('notifies listeners on new items', () => {
  const store = new Store(10);
  let received = null;
  store.onNew(item => { received = item; });
  const item = createItem({ id: 'test', publishedAt: new Date(), title: 'test' });
  store.add(item);
  assert.strictEqual(received.id, 'test');
});

test('Store: getRanked returns items by priority then publishedAt', () => {
  const store = new Store(10);
  store.add(createItem({ id: 'low', publishedAt: new Date('2026-03-21T11:00:00Z'), priority: 1, title: 'Low' }));
  store.add(createItem({ id: 'high', publishedAt: new Date('2026-03-21T10:00:00Z'), priority: 10, title: 'High' }));
  store.add(createItem({ id: 'latest', publishedAt: new Date('2026-03-21T12:00:00Z'), priority: 1, title: 'Latest Low' }));

  const ranked = store.getRanked();
  assert.strictEqual(ranked[0].id, 'high');
  assert.strictEqual(ranked[1].id, 'latest');
  assert.strictEqual(ranked[2].id, 'low');
});

test('Store: automatically scores items if scorer is set', () => {
  const store = new Store(10);
  const mockScorer = {
    score: (item) => createItem({ ...item, priority: item.title.includes('!') ? 100 : 0, raw: item.raw })
  };
  store.setScorer(mockScorer);

  store.add(createItem({ id: '1', publishedAt: new Date(), title: 'Normal' }));
  store.add(createItem({ id: '2', publishedAt: new Date(), title: 'Important!' }));

  const ranked = store.getRanked();
  assert.strictEqual(ranked[0].id, '2');
  assert.strictEqual(ranked[0].priority, 100);
});

test('Store: automatically alerts items if alertsEngine is set', () => {
  const store = new Store(10);
  const mockAlerts = {
    evaluate: (item) => item.title.includes('ALERT') ? ['MATCH'] : []
  };
  store.setAlertsEngine(mockAlerts);

  store.add(createItem({ id: '1', publishedAt: new Date(), title: 'Normal' }));
  store.add(createItem({ id: '2', publishedAt: new Date(), title: 'ALERT: Urgent' }));

  const items = store.getAll();
  const alerted = items.find(i => i.id === '2');
  const normal = items.find(i => i.id === '1');

  assert.deepStrictEqual(alerted.alerts, ['MATCH']);
  assert.deepStrictEqual(normal.alerts, []);
});
