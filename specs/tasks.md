# Tasks

## Completed
- [x] Initial structure scaffolding
- [x] Canonical item model (id, priority, alerts, etc.)
- [x] Source adapter contract (BaseAdapter)
- [x] Source normalization (HN, Reddit, RSS)
- [x] In-memory store contract (deduplication, ordering)
- [x] Scoring engine v1 (recency, weights, keywords)
- [x] Alerts engine v1 (thresholds, keyword matches)
- [x] Flow integration (Store + Scorer + Alerter)
- [x] UI exposure (Ranked items, Alert indicators)
- [x] Test hardening (Unit + Integration)

## Pending (Proposed Next 5 Milestones)
- [ ] **Telegram Adapter**: Build `app/sources/telegram.js` on established contract.
- [ ] **Finance Adapter**: Build `app/sources/finance.js` for ticker data.
- [ ] **Persistence**: Move store from in-memory to SQLite (`app/storage/sqlite.js`).
- [ ] **Advanced Scoring**: Contextual keyword matching or simple NLP.
- [ ] **Action Layer**: Direct alert side-effects (Bells, terminal highlights).
