const BaseAdapter = require('./base');
const { createItem } = require('../models/item');

class RedditAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({ name: 'Reddit', type: 'reddit', ...options });
    this.subreddit = options.config?.subreddit || 'worldnews';
    this.limit = options.config?.limit || 25;
  }

  async fetch() {
    const res = await fetch(
      `https://www.reddit.com/r/${this.subreddit}/new.json?limit=${this.limit}`,
      { headers: { 'User-Agent': 'newsfeed-terminal/1.0' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.data?.children || []).map(child => child.data);
  }

  normalize(raw) {
    return createItem({
      id: `red-${raw.id}`,
      sourceType: this.type,
      sourceName: this.name,
      title: raw.title || '',
      url: raw.url || `https://reddit.com/r/${raw.subreddit}/comments/${raw.id}`,
      publishedAt: raw.created_utc ? new Date(raw.created_utc * 1000) : null,
      topics: [raw.subreddit],
      priority: (raw.score || 0) > 500 ? 1 : 0,
      raw: raw
    });
  }
}

/**
 * Legacy wrapper for server.js
 */
async function pollReddit(subreddits, store) {
  for (const sub of subreddits) {
    const adapter = new RedditAdapter({ config: { subreddit: sub }, name: `r/${sub}` });
    const items = await adapter.poll();
    items.forEach(item => store.add(item));
  }
}

module.exports = { RedditAdapter, pollReddit };
