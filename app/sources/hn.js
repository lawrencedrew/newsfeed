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
  if (!config?.feed) return;
  const limit = Math.min(config.limit || 30, 100);
  try {
    const res = await fetch(`${HN_API}/${config.feed}stories.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ids = (await res.json()).slice(0, limit);
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
