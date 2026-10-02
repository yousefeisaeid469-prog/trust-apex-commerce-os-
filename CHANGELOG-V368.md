# V368 — CONSUMER CONTROL PLANE

## Runtime
- Added per-consumer live health calculation for queue lag, processing age, retry pressure, dead letters and heartbeat freshness.
- Added durable health snapshots.
- Added transactional stale-delivery recovery with bounded batch size and `FOR UPDATE SKIP LOCKED`.
- Added durable idempotent recovery-action ledger.
- Added consumer health API and daily Vercel recovery trigger.
- Preserved the standalone continuous consumer worker as the execution authority.

## Proof boundary
Static/current-head tests verify the control-plane wiring, migration integrity and recovery contracts. They do not claim live PostgreSQL/provider execution unless a real database is configured and exercised.
