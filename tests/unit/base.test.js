const assert = require('assert');
const { test } = require('node:test');
const BaseAdapter = require('../../app/sources/base');
const { createItem } = require('../../app/models/item');

test('BaseAdapter: abstract methods throw when not implemented', async () => {
  const adapter = new BaseAdapter();
  await assert.rejects(async () => await adapter.fetch(), /Adapter must implement fetch/);
  assert.throws(() => adapter.normalize({}), /Adapter must implement normalize/);
});

test('BaseAdapter: concrete implementation executes lifecycle', async () => {
  class FakeAdapter extends BaseAdapter {
    async fetch() {
      return [{ id: '1', text: 'Hello' }];
    }
    normalize(raw) {
      return createItem({
        id: raw.id,
        title: raw.text,
        sourceType: this.type,
        sourceName: this.name
      });
    }
  }

  const adapter = new FakeAdapter({ name: 'Test Source', type: 'mock' });
  const items = await adapter.poll();

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].title, 'Hello');
  assert.strictEqual(items[0].sourceType, 'mock');
  assert.strictEqual(items[0].sourceName, 'Test Source');
  assert.ok(items[0].id);
});

test('BaseAdapter: handles fetch errors gracefully', async () => {
  class ErrorAdapter extends BaseAdapter {
    async fetch() {
      throw new Error('Network failure');
    }
  }

  const adapter = new ErrorAdapter({ name: 'Error Source' });
  const items = await adapter.poll();

  assert.deepStrictEqual(items, []);
});

test('BaseAdapter: provides metadata', () => {
  const adapter = new BaseAdapter({ name: 'Meta', type: 'test', config: { url: 'http://test' } });
  const meta = adapter.getMetadata();
  assert.strictEqual(meta.name, 'Meta');
  assert.strictEqual(meta.type, 'test');
  assert.strictEqual(meta.config.url, 'http://test');
});
