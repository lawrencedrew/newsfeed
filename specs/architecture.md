# Architecture

## Canonical Model (app/models/item.js)
The single source of truth for every item in the system.
- Includes: `id`, `sourceType`, `sourceName`, `title`, `body`, `url`, `publishedAt`, `ingestedAt`, `priority`, `alerts`, `raw`.

## Ingestion Path (app/sources/)
- **BaseAdapter**: Standardized `fetch -> normalize` lifecycle.
- **HN, Reddit, RSS Adapters**: Implementations that emit canonical items.

## Processing Layer
- **ScoringEngine (app/scoring/engine.js)**: Calculates deterministic priority score.
- **AlertsEngine (app/alerts/engine.js)**: Evaluates scored items against matching rules.

## Storage Layer (app/storage/store.js)
- **In-memory store**: Handles deduplication, chron-sorting, and priority-aware ranking.
- **Scoring/Alerts Integration**: Injects processing logic directly into the item addition flow.

## Presentation (app/tui/)
- **Web Terminal**: Consumes SSE snapshots and item streams for real-time display.
