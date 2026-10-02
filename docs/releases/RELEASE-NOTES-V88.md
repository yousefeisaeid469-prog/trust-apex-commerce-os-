# TRUST V88 — APEX OPERATIONAL HARDENING

V88 strengthens the production boundary without pretending that external infrastructure is already connected.

## Added
- Structured redacted logging.
- In-process metrics abstraction.
- Circuit breaker for unreliable external dependencies.
- Environment-driven feature flags.
- API contract/version helpers.
- Durable PostgreSQL foundations for outbox attempts, API idempotency and audit events.
- Contract-check release gate.

## Verification boundary
The repository can be statically audited here. A real deployment still requires installing dependencies, running `next build`, provisioning PostgreSQL, configuring secrets, and executing staging smoke tests.

## V88 regression fixes
- Corrected runtime version export expected by the health route.
- Restored the order transition service consumed by payment webhooks.
- Updated deployment/release scripts and legacy UI labels to V88 where they represent current runtime identity.
