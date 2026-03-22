const BaseAdapter = require('./base');
const { createItem } = require('../models/item');
const RSSParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RSSParser();

/**
 * FinanceAdapter
 * Normalizes finance headlines from public RSS feeds.
 */
class FinanceAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({ name: 'Finance', type: 'finance', ...options });
    this.url = options.config?.url;
    this.sourceKey = options.config?.sourceKey || 'generic';
  }

  /**
   * Fetches RSS feed from the configured URL.
   */
  async fetch() {
    if (!this.url) return [];
    try {
      const feed = await parser.parseURL(this.url);
      return feed.items || [];
    } catch (err) {
      throw new Error(`Failed to fetch finance feed: ${err.message}`, { cause: err });
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
      const content = (raw.contentSnippet || raw.content || '').trim();
      
      // 1. Title Fallback: Derive from body if missing (max 80 chars)
      const title = (raw.title || content.substring(0, 80)).trim() || '[Finance Headline]';

      // 2. Body Fallback: Empty if only headline exists
      const body = raw.title ? content : '';

      // 3. Symbol Extraction: \$[A-Z]{1,5} (explicitly marked only)
      const combinedText = `${title} ${body}`;
      const symbolRegex = /\$([A-Z]{1,5})/g;
      const symbols = [...new Set([...combinedText.matchAll(symbolRegex)].map(m => m[1]))];

      // 4. Canonical ID Strategy: fin:[source_key]:[message_id]
      const msgId = raw.guid || raw.id || crypto.createHash('md5').update(raw.link || title).digest('hex');
      const id = `fin:${this.sourceKey}:${msgId}`;

      return createItem({
        id,
        sourceType: this.type,
        sourceName: this.name,
        title,
        body,
        url: raw.link || '',
        publishedAt: raw.isoDate || raw.pubDate,
        symbols,
        raw: raw
      });
    } catch (err) {
      // 5. Observability: prefix-matching log
      console.error(`[FinanceAdapter:Normalize] Failed to normalize item: ${err.message}`, raw);
      throw err;
    }
  }
}

/**
 * Poller wrapper for runtime orchestration
 */
async function pollFinance(config, store) {
  if (!config?.feeds?.length) return;
  for (const feed of config.feeds) {
    const adapter = new FinanceAdapter({ 
      name: feed.name || 'Finance', 
      config: { url: feed.url, sourceKey: feed.key } 
    });
    const items = await adapter.poll();
    items.forEach(item => store.add(item));
  }
}

module.exports = { FinanceAdapter, pollFinance };
