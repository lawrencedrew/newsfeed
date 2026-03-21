const assert = require('assert');
const { test } = require('node:test');
const { AlertsEngine } = require('../../app/alerts/engine');

test('AlertsEngine: triggers on priority threshold', () => {
  const engine = new AlertsEngine([{ id: 'critical', minPriority: 100 }]);
  const match = engine.evaluate({ id: '1', priority: 150 });
  const noMatch = engine.evaluate({ id: '2', priority: 50 });

  assert.deepStrictEqual(match, ['critical']);
  assert.deepStrictEqual(noMatch, []);
});

test('AlertsEngine: triggers on keywords in title or body', () => {
  const engine = new AlertsEngine([{ id: 'finance-alert', keywords: ['finance', 'stock'] }]);
  
  assert.deepStrictEqual(engine.evaluate({ title: 'Stock market up' }), ['finance-alert']);
  assert.deepStrictEqual(engine.evaluate({ title: 'no match', body: 'check finance' }), ['finance-alert']);
  assert.deepStrictEqual(engine.evaluate({ title: 'unrelated' }), []);
});

test('AlertsEngine: triggers on source match', () => {
  const engine = new AlertsEngine([
    { id: 'hn-only', sourceTypes: ['hn'] },
    { id: 'reuters-only', sourceNames: ['Reuters'] }
  ]);

  assert.deepStrictEqual(engine.evaluate({ sourceType: 'hn' }), ['hn-only']);
  assert.deepStrictEqual(engine.evaluate({ sourceName: 'Reuters' }), ['reuters-only']);
  assert.deepStrictEqual(engine.evaluate({ sourceType: 'rss', sourceName: 'BBC' }), []);
});

test('AlertsEngine: composite rule (AND logic)', () => {
  const engine = new AlertsEngine([{
    id: 'important-hn',
    sourceTypes: ['hn'],
    minPriority: 50,
    keywords: ['urgent']
  }]);

  const match = { sourceType: 'hn', priority: 100, title: 'Urgent update' };
  const failPriority = { sourceType: 'hn', priority: 10, title: 'Urgent update' };
  const failSource = { sourceType: 'rss', priority: 100, title: 'Urgent update' };
  const failKeyword = { sourceType: 'hn', priority: 100, title: 'Chill update' };

  assert.deepStrictEqual(engine.evaluate(match), ['important-hn']);
  assert.deepStrictEqual(engine.evaluate(failPriority), []);
  assert.deepStrictEqual(engine.evaluate(failSource), []);
  assert.deepStrictEqual(engine.evaluate(failKeyword), []);
});

test('AlertsEngine: multiple rule matches', () => {
  const engine = new AlertsEngine([
    { id: 'priority', minPriority: 50 },
    { id: 'keyword', keywords: ['urgent'] }
  ]);

  const both = engine.evaluate({ priority: 100, title: 'Urgent thing' });
  assert.deepStrictEqual(both.sort(), ['keyword', 'priority']);
});

test('AlertsEngine: deterministic behavior', () => {
  const engine = new AlertsEngine([{ id: 'r1', minPriority: 50 }]);
  const item = { priority: 100 };
  
  const res1 = engine.evaluate(item);
  const res2 = engine.evaluate(item);
  
  assert.deepStrictEqual(res1, res2);
});
