const HN_API = 'https://hacker-news.firebaseio.com/v0';

function normaliseHnItem(raw) {
  return {
    id: `hn-${raw.id}`,
    source: 'hn',
    tag: '[HN]',
    title: raw.title || '',
    url: raw.url || `https://news.ycombinator.com/item?id=${raw.id}`,
    timestamp: raw.time ? new Date(raw.time * 1000) : new Date(),
    meta: `▲${raw.score || 0} · ${raw.descendants || 0} comments`,
    breaking: false,
  };
}

async function pollHn(config, store) {
  try {
    const res = await fetch(`${HN_API}/${config.feed}stories.json`);
    const ids = (await res.json()).slice(0, config.limit);
    await Promise.all(ids.map(async id => {
      try {
        const r = await fetch(`${HN_API}/item/${id}.json`);
        const item = await r.json();
        if (item && item.type === 'story' && item.title) {
          store.add(normaliseHnItem(item));
        }
      } catch {}
    }));
  } catch (e) {
    console.error(`[hn] fetch failed: ${e.message}`);
  }
}

module.exports = { normaliseHnItem, pollHn };
