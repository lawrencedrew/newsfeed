const assert = require('assert');
const { test } = require('node:test');
const { TelegramAdapter } = require('../../app/sources/telegram');

test('TelegramAdapter: normalizes a standard text post', () => {
  const adapter = new TelegramAdapter({ name: 'tel/durov', config: { channel: 'durov' } });
  const raw = {
    guid: 'https://t.me/durov/123',
    link: 'https://t.me/durov/123',
    contentSnippet: 'Hello world\nThis is a test message',
    isoDate: '2026-03-21T12:00:00Z'
  };

  const item = adapter.normalize(raw);

  assert.strictEqual(item.id, 'tel:durov:123');
  assert.strictEqual(item.title, 'Hello world');
  assert.strictEqual(item.body, 'Hello world\nThis is a test message');
  assert.strictEqual(item.sourceType, 'telegram');
  assert.strictEqual(item.sourceName, 'tel/durov');
});

test('TelegramAdapter: truncates long titles', () => {
  const adapter = new TelegramAdapter({ config: { channel: 'test' } });
  const longText = 'This is a very long first line that should definitely be truncated because it exceeds eighty characters by a significant margin';
  const raw = { contentSnippet: longText };

  const item = adapter.normalize(raw);
  assert.ok(item.title.length <= 80);
  assert.ok(item.title.endsWith('...'));
});

test('TelegramAdapter: handles media-only posts', () => {
  const adapter = new TelegramAdapter({ config: { channel: 'test' } });
  const raw = {
    guid: 'https://t.me/test/1',
    content: '<img src="photo.jpg">',
    contentSnippet: '' // No text
  };

  const item = adapter.normalize(raw);
  assert.strictEqual(item.title, '[Telegram Message]');
  assert.strictEqual(item.body, '(Media content: [PHOTO])');
});

test('TelegramAdapter: handles forwarded content', () => {
  const adapter = new TelegramAdapter({ config: { channel: 'test' } });
  const raw = {
    content: 'Forwarded from <b>Source Channel</b>\nActual message content',
    contentSnippet: 'Forwarded from Source Channel\nActual message content'
  };

  const item = adapter.normalize(raw);
  assert.ok(item.body.startsWith('[FWD: Source Channel]'));
});

test('TelegramAdapter: handles missing timestamps', () => {
  const adapter = new TelegramAdapter({ config: { channel: 'test' } });
  const raw = { contentSnippet: 'no date' };

  const item = adapter.normalize(raw);
  assert.ok(item.publishedAt instanceof Date);
});

test('TelegramAdapter: generates unique fallback ID if guid missing message ID', () => {
  const adapter = new TelegramAdapter({ config: { channel: 'test' } });
  const raw = { contentSnippet: 'no guid', guid: 'tag:rsshub.app,2026:telegram-channel-test' };

  const item = adapter.normalize(raw);
  assert.ok(item.id.startsWith('tel:test:'));
});
