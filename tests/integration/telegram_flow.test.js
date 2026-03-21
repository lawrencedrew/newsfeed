const assert = require('assert');
const { test, mock } = require('node:test');
const { pollTelegram } = require('../../app/sources/telegram');
const { Store } = require('../../app/storage/store');
const RSSParser = require('rss-parser');

test('Integration: Telegram flow from orchestrator to store', async () => {
  const store = new Store(10);
  const config = {
    bridge: 'https://test-bridge.com',
    channels: ['testchannel']
  };

  // Mock RSSParser.prototype.parseURL
  const mockParseURL = mock.method(RSSParser.prototype, 'parseURL', async (url) => {
    assert.strictEqual(url, 'https://test-bridge.com/testchannel');
    return {
      items: [
        {
          guid: 'https://t.me/testchannel/100',
          link: 'https://t.me/testchannel/100',
          contentSnippet: 'Integration test message',
          isoDate: '2026-03-21T15:00:00Z'
        }
      ]
    };
  });

  await pollTelegram(config, store);

  const items = store.getAll();
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].id, 'tel:testchannel:100');
  assert.strictEqual(items[0].title, 'Integration test message');
  assert.strictEqual(items[0].sourceName, 'tel/testchannel');

  mockParseURL.mock.restore();
});

test('Integration: Telegram flow handles multiple channels', async () => {
  const store = new Store(10);
  const config = {
    bridge: 'https://test-bridge.com',
    channels: ['chan1', 'chan2']
  };

  let callCount = 0;
  mock.method(RSSParser.prototype, 'parseURL', async (url) => {
    callCount++;
    return { items: [{ guid: `id-${callCount}`, contentSnippet: `Msg from ${url}` }] };
  });

  await pollTelegram(config, store);

  assert.strictEqual(callCount, 2);
  assert.strictEqual(store.getAll().length, 2);
  
  mock.restoreAll();
});
