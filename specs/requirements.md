# Requirements

## Functional
- **Normalization**: Every source must be converted to a canonical item model.
- **Scoring**: Items must be ranked by priority (SourceWeight + KeywordWeight + Recency).
- **Alerting**: Items matching priority thresholds or keywords must trigger an alert match.
- **Display**: The UI must show high-priority and alerted items with visual markers.

## Non-Functional
- **Gated Development**: Every change must be verified by tests and linting.
- **Immutability**: Canonical items are frozen objects to prevent state drift.
- **Determinism**: Same input + configuration must always yield the same score/alert result.
- **Modularity**: New sources must be added as isolated adapters implementing a shared contract.
