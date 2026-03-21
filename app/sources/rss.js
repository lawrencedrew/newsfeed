const BaseAdapter = require('./base');
const { createItem } = require('../models/item');
const RSSParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RSSParser({ timeout: 10000 });

class RssAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({ name: 'RSS', type: 'rss', ...options });
    this.url = options.config?.url;
  }

  async fetch() {
    if (!this.url) return [];
    const feed = await parser.parseURL(this.url);
    return feed.items || [];
  }

  normalize(raw) {
    const title = (raw.title || '').trim();
    const url = raw.link || raw.guid || '';
    const id = crypto.createHash('md5').update(url || title).digest('hex');

    return createItem({
      id,
      sourceType: this.type,
      sourceName: this.name,
      title,
      url,
      publishedAt: raw.pubDate ? new Date(raw.pubDate) : null,
      raw: raw
    });
  }
}

/**
 * Legacy wrapper for server.js
 */
async function pollRss(urls, store, source = 'rss') {
  for (const url of urls) {
    const adapter = new RssAdapter({
      type: source,
      name: source === 'nitter' ? 'Twitter' : 'RSS',
      config: { url }
    });
    const items = await adapter.poll();
    items.forEach(item => store.add(item));
  }
}

async function pollNitter(config, store) {
  if (!config?.accounts?.length || !config.instance) return;
  const urls = config.accounts.map(
    account => `${config.instance}/${account}/rss`
  );
  await pollRss(urls, store, 'nitter');
}

module.exports = { RssAdapter, pollRss, pollNitter };
