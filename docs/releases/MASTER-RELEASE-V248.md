# TRUST V248.0.0 — Reality Claim Ledger & Continuous Proof

V248 introduces a machine-readable evidence ledger for the V244–V247 distributed-commerce claims.

## Release rule

A production claim is considered proven only when all three exist:

1. Implementation artifact(s) in the runtime codebase.
2. Executable runtime marker(s) in those artifacts.
3. A regression test covering the claimed behavior.

Documentation, migration presence, or a passing unrelated gate is not sufficient evidence.

## Covered claims

- Runtime-driven consumer subscriptions.
- Persisted and enforced event contract versions.
- Database-driven bounded retry policy.
- Aggregate ordering guards.
- Poison-event failure persistence and dead-letter isolation.
- Idempotent domain effects.
- Runtime consumer/schema registry authority.
- Durable event schema validation.

## Verification

Run `npm run reality-claim-audit` and `npm run v248-reality-claims-test`.
The release gate also requires the V248 ledger artifacts to exist.

No database migration was required for V248.
