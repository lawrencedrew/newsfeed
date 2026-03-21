const assert = require('assert');
const { test } = require('node:test');
const { ScoringEngine } = require('../../app/scoring/engine');
const { createItem } = require('../../app/models/item');

test('ScoringEngine: source weight influence', () => {
  const engine = new ScoringEngine({
    sourceWeights: { 'hn': 100, 'reddit': 50 }
  });
  const now = new Date('2026-03-21T12:00:00Z');
  const hnItem = createItem({ id: '1', sourceType: 'hn', publishedAt: now });
  const redditItem = createItem({ id: '2', sourceType: 'reddit', publishedAt: now });
  const neutralItem = createItem({ id: '3', sourceType: 'rss', publishedAt: now });

  const hnScored = engine.score(hnItem, now);
  const redditScored = engine.score(redditItem, now);
  const neutralScored = engine.score(neutralItem, now);

  assert.ok(hnScored.priority > redditScored.priority, 'HN should be higher than reddit');
  assert.ok(redditScored.priority > neutralScored.priority, 'Reddit should be higher than neutral');
});

test('ScoringEngine: keyword influence', () => {
  const engine = new ScoringEngine({
    watchwords: { 'breaking': 1000, 'finance': 200 }
  });
  const now = new Date('2026-03-21T12:00:00Z');
  const breakingItem = createItem({ id: '1', title: 'BREAKING NEWS', publishedAt: now });
  const financeItem = createItem({ id: '2', title: 'finance report', publishedAt: now });
  const boringItem = createItem({ id: '3', title: 'no keywords', publishedAt: now });

  const breakingScored = engine.score(breakingItem, now);
  const financeScored = engine.score(financeItem, now);
  const boringScored = engine.score(boringItem, now);

  assert.ok(breakingScored.priority > financeScored.priority, 'Breaking keyword should be higher than finance');
  assert.ok(financeScored.priority > boringScored.priority, 'Finance keyword should be higher than boring');
});

test('ScoringEngine: recency influence', () => {
  const engine = new ScoringEngine({
    recencyWeight: 10,
    maxAgeHours: 24
  });
  const now = new Date('2026-03-21T12:00:00Z');
  const freshItem = createItem({ id: '1', publishedAt: now }); // 0h age
  const oldItem = createItem({ id: '2', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) }); // 12h age
  const ancientItem = createItem({ id: '3', publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) }); // 48h age

  const freshScored = engine.score(freshItem, now);
  const oldScored = engine.score(oldItem, now);
  const ancientScored = engine.score(ancientItem, now);

  assert.ok(freshScored.priority > oldScored.priority, 'Fresh item should score higher than 12h old item');
  assert.ok(oldScored.priority > ancientScored.priority, '12h old item should score higher than ancient item');
  assert.strictEqual(ancientScored.priority, 0, 'Ancient item should have 0 priority if no other factors');
});

test('ScoringEngine: deterministic output for same inputs', () => {
  const engine = new ScoringEngine({
    sourceWeights: { 'hn': 50 },
    watchwords: { 'news': 50 }
  });
  const now = new Date('2026-03-21T12:00:00Z');
  const item = createItem({ id: '1', sourceType: 'hn', title: 'important news', publishedAt: now });

  const score1 = engine.score(item, now);
  const score2 = engine.score(item, now);

  assert.strictEqual(score1.priority, score2.priority);
  assert.strictEqual(score1.id, score2.id);
});

test('ScoringEngine: returns new frozen item and preserves raw payload', () => {
  const engine = new ScoringEngine();
  const raw = { extra: 'data' };
  const item = createItem({ id: '1', raw });
  const scored = engine.score(item);

  assert.notStrictEqual(item, scored, 'Should return a new object');
  assert.ok(Object.isFrozen(scored), 'Scored item should be frozen');
  assert.deepStrictEqual(scored.raw, raw, 'Raw payload should be preserved');
});
