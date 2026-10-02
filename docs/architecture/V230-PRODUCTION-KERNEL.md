# TRUST V230 — Production Kernel

V230 adds the next production-hardening layer without pretending unavailable external providers are connected.

## Durable boundaries

- **Request context:** every new platform endpoint can carry independent request and trace IDs.
- **API envelope:** responses expose correlation metadata and disable caching for operational data.
- **Idempotency:** command fingerprints are bound to durable keys and replayed responses.
- **Webhook inbox:** provider/event uniqueness prevents duplicate processing at the persistence boundary.
- **Audit events:** security-sensitive mutations can append durable actor/resource/request evidence.
- **Capability registry:** LIVE, PROVIDER_REQUIRED, FOUNDATION, DISABLED and DEGRADED remain explicit.
- **Health:** the database health endpoint returns 503 when the database is missing or unavailable; it never substitutes fake health.

## Provider truth

A provider boundary is not the provider itself. V230 therefore marks payment capture, external notification delivery, AI generation, vector search and shipping-label execution as `PROVIDER_REQUIRED` until credentials and a concrete adapter are configured.

## Verification

The source-level verification suite is 473/473 passing in the dependency-free environment. Release audit, release gate, migration check and production-kernel audit pass. A full Next.js build/typecheck still requires installing the project's dependencies in a networked environment because the checked-in lockfile is intentionally not a complete dependency graph.

## 100k-line target

The codebase should cross 100,000 meaningful lines through real domain implementation, not generated filler. The target is divided into production workstreams: identity/auth, catalog/search, checkout/payments, fulfillment, merchant operations, customer service, AI/provider adapters, analytics, observability, security, and test/contract coverage. Each increment must add executable behavior, persistence, contracts or verification evidence.
