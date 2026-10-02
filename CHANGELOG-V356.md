# TRUST V356 — Distributed Commerce Workers & Recovery Engine

V356 turns the V355 commerce execution kernel into a durable worker-driven execution surface.

## Production code
- Added `trust_commerce_execution_jobs` with leases, bounded attempts, retry scheduling and dead-letter isolation.
- Added `trust_commerce_execution_attempts` for durable per-attempt operational state.
- Added `modules/commerce/core/execution-worker.ts` with row-lock claiming, lease recovery, exponential backoff, waiting state, bounded retries and dead-letter handling.
- Captured orders now enqueue an idempotent commerce execution job in the same transaction as the execution run/outbox event.
- Worker resumes the existing V355 execution kernel; it does not duplicate payment, inventory or fulfillment side effects.

## Verification boundary
Source-level and migration tests verify the worker contracts and durable queue. Live PostgreSQL/provider/carrier execution is not claimed by these tests.
- Added `scripts/commerce_execution_worker.mjs` and the `commerce-execution-worker` package script for continuous/one-shot production worker execution when `DATABASE_URL` is configured.
