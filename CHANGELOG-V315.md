# V315.0.0 — Verification Platform

## Major upgrade
V315 adds an executable verification layer for critical commerce workflows rather than relying on source-code size or static claims.

### Added
- Deterministic payment and carrier sandbox adapters.
- Failure injection primitives for payment, carrier, database, outbox, network and worker boundaries.
- Deterministic event replay with canonical state hashing.
- Load gates with p50/p95/error-rate checks.
- PostgreSQL probe and rollback harness for environments with `DATABASE_URL`.
- Critical commerce scenario exercising payment failure/failover and carrier recovery.
- Durable verification run/result/failure/replay tables.
- Verification catalog API.
- CI workflow for V315 verification.
- PostgreSQL Docker verification environment descriptor.

### Validation boundary
- Sandbox verification executed locally: PASS.
- Migration sequence/checksum: PASS through migration 153.
- Release audit: PASS.
- Release gate: PASS at V315.0.0.
- Live PostgreSQL: SKIPPED in the current environment because `DATABASE_URL` is absent.
- Live payment/carrier providers: not claimed.
