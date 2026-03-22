# Tasks

## Completed
- [x] Initial structure scaffolding
- [x] Canonical item model
- [x] Source adapter contract
- [x] Source normalization (HN, Reddit, RSS)
- [x] In-memory store contract
- [x] Scoring engine v1
- [x] Alerts engine v1
- [x] Flow integration
- [x] UI exposure
- [x] Test hardening

## Phase-Gated Roadmap (Revised Priority)

### TSK-SRC-04: Telegram Adapter
- **Linked Requirements**: REQ-INT-01 (Telegram Ingestion)
- **Status**: Ready for Specification/Decision.
- **Scope**: Implement `app/sources/telegram.js` using the `BaseAdapter` contract and the approved ingestion method.
- **Acceptance Criteria**:
  - Successfully ingests and normalizes Telegram content to the canonical `Item` model.
  - Normalization logic adheres to the approved Telegram data mapping.
  - Handles media-only posts with placeholders.
  - Unit tests verify normalization and error handling.
- **Allowed Files**: `app/sources/telegram.js`, `tests/unit/telegram.test.js`
- **Commit Message**: `feat: add telegram channel source adapter`
- **ASK FIRST**: Selection of ingestion method and specific channel source strategy.

### TSK-SRC-05: Finance Adapter
- **Linked Requirements**: REQ-INT-02 (Finance Ingestion)
- **Status**: **BLOCKED** on specification.
- **Scope**: Implement `app/sources/finance.js` for one of the following sub-types (to be decided in Specification):
  - a. **Finance Headlines**: News-like headlines from financial sources.
  - b. **Ticker Snapshots**: Current state/quote snapshots for specific symbols.
  - c. **Price Movement Events**: Trigger-based alerts for significant price changes.
- **Acceptance Criteria**:
  - Normalizes financial data into canonical `Item` fields (`title`, `body`, `symbols`, `priority`).
  - Correctly populates the `sentiment` field if available.
  - Unit tests verify deterministic field mapping and symbol extraction.
- **Allowed Files**: `app/sources/finance.js`, `tests/unit/finance.test.js`
- **Commit Message**: `feat: add financial source adapter`
- **ASK FIRST**: **PRE-TASK SPECIFICATION**: Select sub-type (a, b, or c) and define specific data source/API.

### TSK-SYS-02: Expanded Source Integration Coverage
- **Linked Requirements**: REQ-SYS-01 (End-to-End Integrity)
- **Scope**: Create integration tests that exercise all implemented source types (RSS, HN, Reddit, plus the approved Telegram and Finance implementations) through the full pipeline.
- **Acceptance Criteria**:
  - Verified flow: Adapter -> Canonical Model -> Scoring -> Alerts -> Store.
  - Mocks used for all network boundaries.
  - Proof of ranked retrieval including new source types.
- **Allowed Files**: `tests/integration/sources.test.js`
- **Commit Message**: `test: add e2e coverage for expanded source set`

### TSK-STO-03: SQLite Persistence
- **Linked Requirements**: REQ-STO-02 (Persistent Storage)
- **Scope**: Implement `app/storage/sqlite.js` as an alternative provider behind the existing `Store` interface.
- **Acceptance Criteria**:
  - Strictly adheres to the current `Store` contract.
  - Data survives application restarts.
  - Handles capacity limits (eviction) via SQL.
  - Zero changes to `server.js` logic beyond provider injection.
- **Allowed Files**: `app/storage/sqlite.js`, `server.js` (injection), `tests/unit/sqlite.test.js`
- **Commit Message**: `feat: implement sqlite persistence provider`
- **ASK FIRST**: Schema design and selection of SQLite library.

### TSK-REF-01: Operational Refinement
- **Scope**: Based on results from the expanded source set, address the highest priority deficiency.
- **ASK FIRST**: Selection of refinement target (Action Dispatcher, Scoring, or Configuration UX) after Milestone 4.
