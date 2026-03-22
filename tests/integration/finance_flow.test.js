const assert = require('assert');
const { test, mock } = require('node:test');
const { pollFinance } = require('../../app/sources/finance');
const { Store } = require('../../app/storage/store');
const RSSParser = require('rss-parser');

test('Integration: Finance flow from orchestrator to store', async () => {
  const store = new Store(10);
  const config = {
    feeds: [
      { name: 'Test Market', url: 'https://test-finance.com/rss', key: 'test-mkt' }
    ]
  };

  // Mock RSSParser.prototype.parseURL
  const mockParseURL = mock.method(RSSParser.prototype, 'parseURL', async (url) => {
    assert.strictEqual(url, 'https://test-finance.com/rss');
    return {
      items: [
        {
          guid: 'fin-123',
          title: 'Market rally as $TKR hits highs',
          contentSnippet: 'Bullish sentiment prevails.',
          isoDate: '2026-03-21T16:00:00Z',
          link: 'https://test-finance.com/123'
        }
      ]
    };
  });

  await pollFinance(config, store);

  const items = store.getAll();
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].id, 'fin:test-mkt:fin-123');
  assert.strictEqual(items[0].title, 'Market rally as $TKR hits highs');
  assert.deepStrictEqual(items[0].symbols, ['TKR']);
  assert.strictEqual(items[0].sourceName, 'Test Market');

  mockParseURL.mock.restore();
});

test('Integration: Finance flow handles multiple feeds', async () => {
  const store = new Store(10);
  const config = {
    feeds: [
      { name: 'Feed 1', url: 'https://f1.com', key: 'f1' },
      { name: 'Feed 2', url: 'https://f2.com', key: 'f2' }
    ]
  };

  let callCount = 0;
  mock.method(RSSParser.prototype, 'parseURL', async (url) => {
    callCount++;
    return { items: [{ guid: `id-${callCount}`, title: `Finance from ${url}` }] };
  });

  await pollFinance(config, store);

  assert.strictEqual(callCount, 2);
  assert.strictEqual(store.getAll().length, 2);
  
  mock.restoreAll();
});
