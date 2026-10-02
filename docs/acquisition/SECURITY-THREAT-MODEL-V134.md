# TRUST V134 — Security Threat Model

## Trust boundaries
- Browser/client → Next.js HTTP boundary.
- Authenticated actor → tenant-scoped application services.
- Application → PostgreSQL authoritative state.
- Application → payment provider webhook boundary.
- Worker → durable job queue.
- Outbox → external side effects.

## High-risk threats
- Credential stuffing and session theft.
- Cross-tenant object access.
- Replay or mutation of idempotent commands.
- Forged or replayed payment webhooks.
- Out-of-order payment/refund events.
- Double-spend through concurrency.
- Inventory oversell/negative stock.
- Worker double execution after lease expiry.
- Privilege escalation through agent/admin controls.
- Sensitive data leakage through logs or error responses.

## Controls in V134
- Request-bound idempotency fingerprints.
- Constant-time webhook signature verification.
- Database row locking and unique constraints on critical identities.
- Payment transition state machine.
- Durable job leases and dead-letter behavior.
- Sensitive fabric route authorization.
- Database inventory and money invariants.
- Correlated request IDs for incident investigation.

## Required external assurance
- OWASP ASVS-oriented penetration test.
- Dependency vulnerability scan and signed SBOM.
- Secrets scan.
- DAST against a deployed environment.
- Tenant-isolation test suite with adversarial IDs.
- Restore/rollback/incident-response exercises.
