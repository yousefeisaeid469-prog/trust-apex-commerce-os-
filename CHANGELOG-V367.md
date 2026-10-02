# V367 — REAL CONSUMER EXECUTION RUNTIME

V367 closes the next runtime gap after V366: durable consumer deliveries now have a hardened worker execution path with durable run/heartbeat state and renewable delivery leases.

## Runtime
- Added `scripts/commerce_consumer_worker.mjs` as the canonical consumer worker.
- Added durable consumer run ledger and per-consumer heartbeat.
- Added delivery lease renewal while handlers execute.
- Preserved bounded retry and dead-letter behavior.
- Kept `scripts/commerce_consumer_mesh.mjs` as a compatibility wrapper.

## Proof boundary
Static/current-head tests prove the worker wiring and persistence contracts. They do not claim live PostgreSQL execution unless a real database is configured.
