# Repository Map

```text
/home/lawrence/newsfeed/
├── app/
│   ├── tui/       # Web terminal UI
│   ├── ingest/    # Config and polling logic
│   ├── sources/   # Source adapters (HN, Reddit, RSS)
│   ├── models/    # Canonical Item model
│   ├── storage/   # In-memory store
│   ├── scoring/   # Scoring engine
│   └── alerts/    # Alerts engine
├── tests/
│   ├── unit/      # Logic tests
│   └── integration/ # Workflow tests
├── docs/          # Legacy/Project docs
├── specs/         # Current feature specs
└── steering/      # Engineering standards
```
