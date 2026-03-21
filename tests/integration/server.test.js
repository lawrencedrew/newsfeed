const assert = require('assert');
const { test } = require('node:test');
const { Store } = require('../../app/storage/store');
const { ScoringEngine } = require('../../app/scoring/engine');
const { AlertsEngine } = require('../../app/alerts/engine');
const { createItem } = require('../../app/models/item');

test('Integration: Store with Scoring and Alerts provides ranked and alerted data', () => {
  const store = new Store(10);
  const scorer = new ScoringEngine({ watchwords: { 'URGENT': 100 } });
  const alerts = new AlertsEngine([{ id: 'URGENCY-MATCH', keywords: ['URGENT'] }]);
  
  store.setScorer(scorer);
  store.setAlertsEngine(alerts);

  const rawItem1 = { id: '1', title: 'Normal report', publishedAt: new Date('2026-03-21T10:00:00Z') };
  const rawItem2 = { id: '2', title: 'URGENT news item', publishedAt: new Date('2026-03-21T09:00:00Z') };
  
  store.add(createItem(rawItem1));
  store.add(createItem(rawItem2));

  // Item 2 should have high priority and match the alert
  const ranked = store.getRanked();
  assert.strictEqual(ranked[0].id, '2', 'Item with URGENT watchword must be ranked first');
  assert.ok(ranked[0].priority >= 100, 'Item 2 should have received the watchword priority bonus');
  assert.deepStrictEqual(ranked[0].alerts, ['URGENCY-MATCH'], 'Item 2 must trigger the expected alert');

  // Item 1 should be lower priority
  assert.strictEqual(ranked[1].id, '1', 'Normal item should be ranked second');
  assert.deepStrictEqual(ranked[1].alerts, [], 'Normal item should not have alerts');
});

test('Integration: snapshot data retrieval mimics server logic', () => {
  const store = new Store(10);
  store.add({ id: 'low', priority: 0, publishedAt: new Date('2026-03-21T10:00:00Z') });
  store.add({ id: 'high', priority: 100, publishedAt: new Date('2026-03-21T09:00:00Z') });

  // This mirrors what app.get('/stream') does
  const snapshot = store.getRanked();
  
  assert.strictEqual(snapshot[0].id, 'high', 'Ranked snapshot must return high priority first');
  assert.strictEqual(snapshot[1].id, 'low', 'Second item should be the lower priority one');
});
