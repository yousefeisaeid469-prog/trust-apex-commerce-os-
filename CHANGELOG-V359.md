# V359 — Commerce Control Plane

V359 turns the commerce worker from an opaque background process into an operational subsystem with durable run records and a database heartbeat.

## Runtime changes
- Durable `trust_commerce_worker_runs` records each worker invocation and outcome.
- Durable singleton heartbeat records the latest worker health and counters.
- Vercel cron records start/finish/failure state instead of only returning JSON.
- Added `/api/health/commerce` for queue + worker health.
- Existing lease/retry/dead-letter execution remains the source of truth for jobs.
- No fake PASS claims: the health endpoint is degraded when the database is unavailable, the heartbeat is stale, or dead jobs exist.

## Migration
- Added migration 189: `189_v359_commerce_control_plane.sql`.
