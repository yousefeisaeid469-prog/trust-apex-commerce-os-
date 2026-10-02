# V358.0.0 — Hobby-Safe Serverless Commerce Scheduling

## Problem fixed
V357 configured the Vercel Cron worker for `* * * * *` (every minute). Vercel's current Hobby plan only permits cron execution once per day, so a minute-level schedule is not compatible with Hobby deployments and can block deployment.

## Production-safe design
- Vercel Cron is now scheduled once per day at `03:00` UTC.
- The durable commerce execution worker remains available as a standalone process via `npm run commerce-execution-worker` for environments that provide a sub-daily scheduler or long-lived worker.
- The existing PostgreSQL job table, leases, bounded retries, waiting states, and dead-letter state remain the source of truth; the Vercel cron is a recovery/drain trigger, not the queue itself.
- `CRON_SECRET` remains mandatory for direct HTTP invocation of the cron route.
- `TRUST_COMMERCE_CRON_BATCH` still controls the daily recovery batch (default 10, capped at 25 by the route).

## Important operational note
A Hobby Vercel deployment is now deploy-safe, but it should not be described as a once-per-minute background-worker environment. Sub-daily execution requires a separately scheduled trigger/long-lived worker environment or a Vercel plan/configuration that supports the required frequency.

## No database migration
No schema change was required; the existing 188 canonical migrations remain authoritative.
