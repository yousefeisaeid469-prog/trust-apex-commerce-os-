# TRUST V71 — Production Hardening

## What changed
- Added a persistence abstraction so commerce services can move from memory to Postgres/another durable store without rewriting domain logic.
- Added an idempotency-store contract for payment/order webhook safety.
- Added request-ID utilities for distributed tracing.
- Health endpoint now reports readiness state and runtime version.

## Important
The default adapter is intentionally in-memory for local/demo operation. Orders and inventory are **not durable across process restarts** until a real database adapter is configured.

## Production gate
Before live commerce: configure durable persistence, authentication/authorization, payment provider + signed webhooks, secrets, observability, backups, and transactional inventory reservation.
