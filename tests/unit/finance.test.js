const assert = require('assert');
const { test } = require('node:test');
const { FinanceAdapter } = require('../../app/sources/finance');

test('FinanceAdapter: normalizes a standard headline with body and symbols', () => {
  const adapter = new FinanceAdapter({ name: 'Market News', config: { sourceKey: 'mkt' } });
  const raw = {
    guid: 'guid-123',
    title: 'Apple shares rise as $AAPL announces buyback',
    contentSnippet: 'The company announced a massive buyback today.',
    isoDate: '2026-03-21T14:00:00Z',
    link: 'https://finance.example.com/123'
  };

  const item = adapter.normalize(raw);

  assert.strictEqual(item.id, 'fin:mkt:guid-123');
  assert.strictEqual(item.title, 'Apple shares rise as $AAPL announces buyback');
  assert.strictEqual(item.body, 'The company announced a massive buyback today.');
  assert.deepStrictEqual(item.symbols, ['AAPL']);
  assert.strictEqual(item.sourceType, 'finance');
});

test('FinanceAdapter: title fallback from body when title is missing', () => {
  const adapter = new FinanceAdapter({ config: { sourceKey: 'mkt' } });
  const raw = {
    contentSnippet: 'This is a long body text that should be used as title because title is missing.',
    isoDate: '2026-03-21T14:00:00Z'
  };

  const item = adapter.normalize(raw);
  assert.strictEqual(item.title, 'This is a long body text that should be used as title because title is missing.');
  assert.strictEqual(item.body, ''); // Body fallback: empty if title was missing and body used for title
});

test('FinanceAdapter: body is empty when only headline exists', () => {
  const adapter = new FinanceAdapter();
  const raw = {
    title: 'Headline only',
    contentSnippet: '',
    isoDate: '2026-03-21T14:00:00Z'
  };

  const item = adapter.normalize(raw);
  assert.strictEqual(item.title, 'Headline only');
  assert.strictEqual(item.body, '');
});

test('FinanceAdapter: extracts multiple explicitly marked symbols', () => {
  const adapter = new FinanceAdapter();
  const raw = {
    title: '$BTC and $ETH are volatile',
    contentSnippet: 'Market movement seen in $MSFT and $GOOG today.',
  };

  const item = adapter.normalize(raw);
  assert.ok(item.symbols.includes('BTC'));
  assert.ok(item.symbols.includes('ETH'));
  assert.ok(item.symbols.includes('MSFT'));
  assert.ok(item.symbols.includes('GOOG'));
  assert.strictEqual(item.symbols.length, 4);
});

test('FinanceAdapter: ignores unmarked tokens', () => {
  const adapter = new FinanceAdapter();
  const raw = {
    title: 'AAPL is up while US stocks are down',
    contentSnippet: 'No marked symbols here.',
  };

  const item = adapter.normalize(raw);
  assert.strictEqual(item.symbols.length, 0);
});

test('FinanceAdapter: handles missing IDs with deterministic fallback', () => {
  const adapter = new FinanceAdapter({ config: { sourceKey: 'test' } });
  const raw = {
    title: 'No GUID',
    link: 'https://example.com/noguid'
  };

  const item = adapter.normalize(raw);
  assert.ok(item.id.startsWith('fin:test:'));
  assert.strictEqual(item.id.length, 9 + 32); // fin:test: + md5
});

test('FinanceAdapter: handles missing timestamps', () => {
  const adapter = new FinanceAdapter();
  const raw = { title: 'No date' };

  const item = adapter.normalize(raw);
  assert.ok(item.publishedAt instanceof Date);
});
