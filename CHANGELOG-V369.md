# V369 — UNIFIED COMMERCE OPERATIONS BRAIN

## Runtime
- Correlates the durable outbox publisher, consumer mesh and commerce execution worker into one operational view.
- Detects stale workers, undraining queues, dead work and degraded consumer mesh conditions.
- Persists unified operational snapshots and incident classifications.
- Adds a safe operations recovery cycle that reclaims stale consumer deliveries and expired commerce execution leases without touching customer or financial balances directly.
- Adds `/api/health/commerce/control-plane` and a CRON-protected recovery trigger at `/api/cron/commerce-operations`.
- Fixes the V368 stale-delivery attempt alias so recovery compares the actual delivery attempt count.

## Proof boundary
Current-head tests verify runtime wiring and migration/version integrity. No live PostgreSQL/provider execution is claimed unless a configured database is actually exercised.
