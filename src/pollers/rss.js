const RSSParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RSSParser({ timeout: 10000 });

function normaliseRssItem(raw, source) {
  const tag = source === 'nitter' ? '[TWX]' : '[RSS]';
  const title = (raw.title || '').trim();
  const url = raw.link || raw.guid || '';
  const timestamp = raw.pubDate ? new Date(raw.pubDate) : new Date();
  const id = crypto.createHash('md5').update(url || title).digest('hex');
  const breaking = /breaking/i.test(title);
  return { id, source, tag, title, url, timestamp, breaking, meta: '' };
}

async function pollRss(urls, store, source = 'rss') {
  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of (feed.items || [])) {
        store.add(normaliseRssItem(item, source));
      }
    } catch (e) {
      console.error(`[rss] failed to fetch ${url}: ${e.message}`);
    }
  }
}

async function pollNitter(config, store) {
  const urls = config.accounts.map(
    account => `${config.instance}/${account}/rss`
  );
  await pollRss(urls, store, 'nitter');
}

module.exports = { normaliseRssItem, pollRss, pollNitter };
