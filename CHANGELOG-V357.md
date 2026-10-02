# V357 — Serverless Commerce Worker Trigger

## Problem solved
V356 had a durable commerce execution worker, but the worker runner was a long-lived standalone process. A Vercel deployment could therefore leave captured orders in `FULFILLMENT_PLANNED` until an external process manually ran the worker.

## Production implementation
- Added `/api/cron/commerce-execution-worker` as a Node.js serverless worker trigger.
- Added Vercel Cron configuration at one-minute cadence.
- Added `CRON_SECRET` bearer authentication; unauthenticated calls return `401`.
- The trigger runs one bounded worker batch and expired-lease recovery per invocation.
- Reuses V356 durable leases, `FOR UPDATE SKIP LOCKED`, idempotency, retry/backoff and dead-letter behavior.
- Added bounded batch configuration through `TRUST_COMMERCE_CRON_BATCH` (1–25).
- Added Vercel region-aware worker IDs for operational tracing.
- Kept the standalone worker for non-Vercel/self-hosted deployments.

## Verification boundary
Source-level, route, configuration, syntax and regression checks prove the trigger is wired correctly. Live Vercel Cron invocation and live PostgreSQL/provider execution still require deployment credentials and a real environment.
