# Newsfeed Terminal Design — 2026-03-04

## Summary

A local web app that aggregates RSS feeds, Hacker News, Reddit, and Twitter (via Nitter RSS) into a Bloomberg/matrix-style terminal UI with colour-coded sources, a breaking news ticker, and real-time updates.

## Architecture

```
config.json          ← feed URLs, subreddits, Nitter accounts
     │
server.js (Express)
  ├── Poller (every 60s)
  │     ├── rss-parser   → RSS/Atom feeds + Nitter RSS
  │     ├── HN API       → top/new stories
  │     └── Reddit API   → public subreddit .json (no auth)
  ├── Deduplicator + in-memory cache (last 500 items)
  └── GET /stream        → SSE pushes new items to browser
           │
      browser (index.html + app.js + style.css)
        └── EventSource → appends items to feed in real time
```

- No database — items live in memory, reset on restart
- No auth, no accounts needed for any source
- Run with `node server.js`, open `localhost:3000`

## Config

```json
{
  "rss": [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
  ],
  "reddit": ["worldnews", "technology", "geopolitics"],
  "nitter": ["BreakingNews", "Reuters"],
  "hackernews": { "feed": "top", "limit": 30 }
}
```

- RSS and Nitter fetched via `rss-parser`
- Reddit via `https://reddit.com/r/{sub}/new.json` — no API key
- HN via the official Firebase API — title, score, comment count
- All sources polled every 60s, new items pushed immediately via SSE
- Items tagged with source type for colour-coding

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NEWSFEED                                    ⟳ 14:22:01 GMT     │
├─────────────────────────────────────────────────────────────────┤
│ [LIVE] ▶ Breaking: Markets surge on Fed pivot · Reuters · 14:22 │
├──────────┬──────────────────────────────┬───────────────────────┤
│  SOURCES │  FEED                        │  ARTICLE              │
│          │                              │                       │
│ ■ RSS    │ [HN]  ▲342 Ask HN: Why...   │  (press Enter to open │
│ ■ HN     │ [RSS] ▶ Breaking: Markets.. │   article in panel,   │
│ ■ Reddit │ [RED] ↑ r/worldnews: ...    │   or browser)         │
│ ■ Nitter │ [TWX] ◆ @Reuters: Thread..  │                       │
│          │ [HN]  ▲198 Show HN: I built │                       │
│  FILTER  │ [RED] ↑ r/technology: ...   │                       │
│ [search] │ [RSS] ▶ EU passes new law.. │                       │
│          │ [TWX] ◆ @BreakingNews: ...  │                       │
└──────────┴──────────────────────────────┴───────────────────────┘
```

### Panels

- **Ticker**: Breaking news items (RSS items with "breaking" in title) scroll across the top
- **Left**: Source toggles (click to show/hide), live search/filter box
- **Centre**: Unified chronological feed, colour-coded by source, new items prepend at top
- **Right**: Article preview on Enter; `o` opens in browser

### Colour coding

| Source  | Tag    | Colour  |
|---------|--------|---------|
| RSS     | [RSS]  | Green   |
| Hacker News | [HN] | Orange |
| Reddit  | [RED]  | Red     |
| Nitter  | [TWX]  | Cyan    |

### Keyboard shortcuts

| Key     | Action                        |
|---------|-------------------------------|
| j / k   | Navigate feed up/down         |
| Enter   | Open article preview          |
| o       | Open in browser               |
| f       | Focus filter box              |
| r       | Force refresh all sources     |
| 1-4     | Toggle source visibility      |

## Tech Stack

- **Runtime**: Node.js
- **Server**: Express
- **Feed parsing**: `rss-parser`
- **Reddit**: public `.json` API (no auth)
- **HN**: `https://hacker-news.firebaseio.com/v0/`
- **Real-time**: Server-Sent Events (SSE)
- **Frontend**: Vanilla JS + CSS (no framework, no build step)
- **Font**: Monospace (system or Google Fonts `JetBrains Mono`)

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express server, poller, SSE endpoint |
| `config.json` | User feed configuration |
| `public/index.html` | App shell |
| `public/app.js` | SSE client, keyboard nav, render logic |
| `public/style.css` | Terminal aesthetic styles |
| `package.json` | Dependencies |
