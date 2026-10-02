# TRUST V130 — Production Excellence

V130 preserves the complete V129 feature surface and closes additional operational integrity gaps.

## Added
- Durable PostgreSQL-backed job queue/control plane; no process-local authoritative job state.
- Database-backed login failure throttling keyed by normalized account + source address.
- Provider webhook event uniqueness enforced at the database layer.
- Production readiness gate validating HTTPS configuration, required secrets, migration sequence/checksums, database reachability, job persistence and outbox backlog.
- Stronger payment input invariant: payment amounts must be strictly positive.
- Cryptographically stronger payment intent fallback identifier using `crypto.randomUUID()` when available.
- Unified webhook secret fallback so the canonical `TRUST_WEBHOOK_SECRET` can secure payment webhooks without silently requiring a second secret.

## Preserved
All V129 identity, commerce, payment, logistics, intelligence, agent, trust, evidence, decision-fabric, audit, outbox, merchant and consumer capabilities remain in place.

## Verification
Run:

```bash
npm install
npm run test
npm run typecheck
npm run migration-check
npm run audit
npm run release-gate
npm run contract-check
npm run parity-check
npm run production-readiness
npm run build
```

Production database migration, external provider verification, browser E2E, load, disaster recovery and live payment settlement remain environment-level acceptance tests and are intentionally not represented as source-only passes.
