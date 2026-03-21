const BaseAdapter = require('./base');
const { createItem } = require('../models/item');

const HN_API = 'https://hacker-news.firebaseio.com/v0';

class HnAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({ name: 'Hacker News', type: 'hn', ...options });
    this.feed = options.config?.feed || 'top';
    this.limit = Math.min(options.config?.limit || 30, 100);
  }

  async fetch() {
    const res = await fetch(`${HN_API}/${this.feed}stories.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ids = (await res.json()).slice(0, this.limit);

    const items = await Promise.all(ids.map(async id => {
      try {
        const r = await fetch(`${HN_API}/item/${id}.json`);
        return await r.json();
      } catch (e) {
        return null;
      }
    }));

    return items.filter(item => item && item.type === 'story' && item.title);
  }

  normalize(raw) {
    return createItem({
      id: `hn-${raw.id}`,
      sourceType: this.type,
      sourceName: this.name,
      title: raw.title || '',
      url: raw.url || `https://news.ycombinator.com/item?id=${raw.id}`,
      publishedAt: raw.time ? new Date(raw.time * 1000) : null,
      priority: (raw.score || 0) > 100 ? 1 : 0,
      raw: raw
    });
  }
}

/**
 * Legacy wrapper for server.js
 */
async function pollHn(config, store) {
  const adapter = new HnAdapter({ config });
  const items = await adapter.poll();
  items.forEach(item => store.add(item));
}

module.exports = { HnAdapter, pollHn };
