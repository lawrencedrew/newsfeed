function formatScore(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function normaliseRedditItem(child) {
  const d = child.data;
  return {
    id: `red-${d.id}`,
    source: 'reddit',
    tag: '[RED]',
    title: d.title || '',
    url: d.url || `https://reddit.com/r/${d.subreddit}/comments/${d.id}`,
    timestamp: new Date(d.created_utc * 1000),
    meta: `↑${formatScore(d.score || 0)} · r/${d.subreddit}`,
    breaking: /breaking/i.test(d.title || ''),
  };
}

async function pollReddit(subreddits, store) {
  for (const sub of subreddits) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=25`,
        { headers: { 'User-Agent': 'newsfeed-terminal/1.0' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      for (const child of (json.data?.children || [])) {
        store.add(normaliseRedditItem(child));
      }
    } catch (e) {
      console.error(`[reddit] r/${sub} failed: ${e.message}`);
    }
  }
}

module.exports = { normaliseRedditItem, pollReddit };
