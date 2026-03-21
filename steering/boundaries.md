# Architectural Boundaries

## UI (app/tui/)
The TUI is a **pure consumer** of the store and snapshot stream. It must not perform its own scoring, alerts evaluation, or ingestion logic.

## Ingestion (app/sources/)
Adapters are **pure emitters**. They must implement the `BaseAdapter` contract and return items in the canonical model. They must not have knowledge of storage internals or downstream scoring rules.

## Processing (app/scoring/, app/alerts/)
Scoring and alerts engines are **pure evaluators**. They accept canonical items and return scored/matched versions. They must not perform network IO or mutate global state.

## Storage (app/storage/)
Storage is the **central orchestrator** for item state. It manages deduplication, ordering, and capacity. It integrates with scorers and alerters during the addition flow to ensure consistent state.
