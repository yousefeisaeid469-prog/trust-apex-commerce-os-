# V366 — COMMERCE EVENT PUBLISHER RUNTIME

## Implemented
- Durable outbox publisher runtime extracted into `modules/platform/commerce-events/publisher.ts`.
- Batch claiming with `FOR UPDATE SKIP LOCKED` and stale-processing recovery.
- Bounded exponential retry with explicit `dead` terminal state after max attempts.
- Durable publisher run ledger and heartbeat.
- Vercel-compatible daily recovery endpoint at `/api/cron/commerce-event-publisher` protected by `CRON_SECRET`.
- Standalone worker remains the continuous execution path for production infrastructure.
- Publisher queue can now be observed independently from commerce execution workers.
