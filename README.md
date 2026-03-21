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

## Architecture

RetroFeed is designed with modularity and testability in mind.

- **app/tui**: Terminal UI components (currently web-based).
- **app/ingest**: Data ingestion orchestration and configuration.
- **app/sources**: Adapters for various news and data sources (RSS, HN, Reddit).
- **app/models**: Core data structures and types.
- **app/storage**: In-memory or persistent data stores.
- **app/scoring**: Logic for ranking and filtering content.
- **app/alerts**: Notifications and threshold-based triggers.
- **tests/unit**: Isolated logic tests.
- **tests/integration**: Cross-module workflow tests.

## Quality Gates

Run these commands to verify code quality:

```bash
npm test        # Run unit tests
npm run lint    # Run ESLint
```
