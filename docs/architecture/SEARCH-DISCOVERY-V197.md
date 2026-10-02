# TRUST V197 — Search & Discovery 3.0

V197 adds a catalog-backed discovery boundary on top of the existing deterministic discovery engine.

## Capabilities
- Arabic Unicode normalization and typo-tolerant token matching.
- Category inference from the current catalog.
- Deterministic search suggestions from catalog vocabulary.
- Explainable hit reasons.
- API boundary at `/api/discovery`.
- Dedicated discovery experience at `/discovery`.

## Production honesty
The API currently reads the active catalog through the existing PostgreSQL repository and ranks the returned catalog slice in application code. It is not presented as a distributed search index, semantic vector database, or production-scale search cluster. Those require real infrastructure and load validation.
