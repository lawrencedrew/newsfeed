const BaseAdapter = require('./base');
const { createItem } = require('../models/item');
const RSSParser = require('rss-parser');

const parser = new RSSParser();

/**
 * TelegramAdapter
 * Normalizes Telegram content via an RSS bridge (e.g. RSSHub).
 */
class TelegramAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({ name: 'Telegram', type: 'telegram', ...options });
    this.channel = options.config?.channel;
    this.bridgeUrl = options.config?.bridge || 'https://rsshub.app/telegram/channel';
  }

  /**
   * Fetches RSS feed from the bridge.
   */
  async fetch() {
    if (!this.channel) return [];
    const url = `${this.bridgeUrl.replace(/\/$/, '')}/${this.channel}`;
    try {
      const feed = await parser.parseURL(url);
      return feed.items || [];
    } catch (err) {
      throw new Error(`Failed to fetch from bridge: ${err.message}`, { cause: err });
    }
  }

  /**
   * Normalizes an RSS item into a canonical item.
   */
  normalize(raw) {
    if (!raw) {
      throw new Error('raw item is required');
    }

    try {
      const text = (raw.contentSnippet || '').trim();
      
      // 1. Title Derivation: First line, max 80 chars
      let title = text.split('\n')[0].trim();
      if (!title) {
        title = '[Telegram Message]';
      } else if (title.length > 80) {
        title = title.substring(0, 77) + '...';
      }

      // 2. Body: Preserving content, mapping media if present
      let body = text;
      if (!text) {
        const mediaTag = this.detectMedia(raw.content || '');
        body = mediaTag ? `(Media content: ${mediaTag})` : '(No text content)';
      }

      // 3. Forwarded context
      if (raw.content && raw.content.includes('Forwarded from')) {
        const match = raw.content.match(/Forwarded from\s+<b>([^<]+)<\/b>/i) || 
                      raw.content.match(/Forwarded from\s+([^<\n]+)/i);
        if (match) {
          body = `[FWD: ${match[1].trim()}] ${body}`;
        }
      }

      // 4. Canonical ID Strategy: tel:[channel]:[msg_id]
      // RSSHub typically provides GUIDs like https://t.me/channel/123
      const msgIdMatch = (raw.guid || '').match(/\/(\d+)$/);
      const msgId = msgIdMatch ? msgIdMatch[1] : (raw.id || Math.random().toString(36).substring(7));
      const id = `tel:${this.channel}:${msgId}`;

      return createItem({
        id,
        sourceType: this.type,
        sourceName: this.name,
        title,
        body,
        url: raw.link || `https://t.me/${this.channel}/${msgId}`,
        publishedAt: raw.isoDate || raw.pubDate,
        raw: raw
      });
    } catch (err) {
      // 5. Observability: Initial implementation using console.error
      console.error(`[TelegramAdapter:Normalize] Failed to normalize item: ${err.message}`, raw);
      throw err;
    }
  }

  /**
   * Helper to detect media types in HTML content
   */
  detectMedia(html) {
    if (/<img/i.test(html)) return '[PHOTO]';
    if (/<video/i.test(html)) return '[VIDEO]';
    if (/<audio/i.test(html)) return '[AUDIO]';
    if (/<iframe/i.test(html)) return '[VIDEO]';
    return null;
  }
}

/**
 * Poller wrapper for server.js
 */
async function pollTelegram(config, store) {
  if (!config?.channels?.length) return;
  for (const channel of config.channels) {
    const adapter = new TelegramAdapter({ 
      name: `tel/${channel}`, 
      config: { channel, bridge: config.bridge } 
    });
    const items = await adapter.poll();
    items.forEach(item => store.add(item));
  }
}

module.exports = { TelegramAdapter, pollTelegram };
