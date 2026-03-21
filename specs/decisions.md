# Architectural Decisions

## AD-01: Canonical Model over Source-Specific Shapes
Every ingestion source must normalize to a single, frozen `Item` model. This prevents "schema leakage" from source providers (like HN or Reddit) into downstream components.

## AD-02: BaseAdapter Contract for Extensibility
Using a shared `BaseAdapter` class ensures that all future sources follow a predictable `fetch -> normalize` lifecycle, simplifying the orchestrator.

## AD-03: In-Memory Storage Contract
Hardening the in-memory store before moving to a database ensures that the application logic (deduplication, ranking, sorting) is decoupled from the persistence engine.

## AD-04: Deterministic Scoring & Alerts
All processing logic is pure and deterministic. This allows testing with static item snapshots and ensures that identical data always produces the same priority and alert flags.
