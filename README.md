# newsfeed

A local web app news aggregator with a Bloomberg/matrix-style terminal UI. Pulls from RSS/Atom feeds, Hacker News, Reddit, and Nitter, then streams all items to the browser in real time via Server-Sent Events. No API keys required.

## Quick start

```bash
npm install
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

## Config

Edit `config.json` in the project root:

| Field | Type | Description |
|---|---|---|
| `port` | number | Port the HTTP server listens on (default `3000`) |
| `pollIntervalSecs` | number | How often each source is re-polled in seconds |
| `maxItems` | number | Maximum number of items held in the in-memory store |
| `rss` | string[] | List of RSS/Atom feed URLs to poll |
| `reddit` | string[] | List of subreddit names (without `r/`) to poll |
| `nitter.instance` | string | Base URL of the Nitter instance to use |
| `nitter.accounts` | string[] | Twitter/X account names to poll via Nitter |
| `hackernews.feed` | string | Which HN feed to use: `"top"`, `"new"`, or `"best"` |
| `hackernews.limit` | number | Number of HN stories to fetch per poll |

Example:

```json
{
  "port": 3000,
  "pollIntervalSecs": 60,
  "maxItems": 500,
  "rss": [
    "https://feeds.bbci.co.uk/news/rss.xml"
  ],
  "reddit": ["worldnews", "technology"],
  "nitter": {
    "instance": "https://nitter.poast.org",
    "accounts": ["Reuters", "BreakingNews"]
  },
  "hackernews": {
    "feed": "top",
    "limit": 30
  }
}
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `j` / `k` | Navigate down / up |
| `Enter` | Open inline preview for selected item |
| `o` | Open selected item in browser |
| `f` | Filter / search items |
| `r` | Refresh feed manually |
| `1` | Toggle RSS source |
| `2` | Toggle Hacker News source |
| `3` | Toggle Reddit source |
| `4` | Toggle Nitter source |

## Sources

- **RSS/Atom** — any standard RSS or Atom feed URL
- **Hacker News** — top, new, or best stories via the official HN API
- **Reddit** — subreddit listings via the public JSON API
- **Nitter** — Twitter/X accounts via a self-hosted or public Nitter instance

No API keys or accounts are needed for any source.
