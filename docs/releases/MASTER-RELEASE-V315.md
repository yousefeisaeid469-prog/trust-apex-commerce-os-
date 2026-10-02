# TRUST V315 Release

## Version
V315.0.0

## Scope
Verification and integration foundation for critical workflows.

## Included
- Verification contracts and evidence aggregation.
- Failure injection and deterministic replay.
- Payment/carrier sandbox adapters.
- PostgreSQL integration harness with rollback verification.
- Load/performance gate primitives.
- Verification catalog API.
- Migration 153 and durable evidence tables.

## Validation
- V315 automated verification tests: PASS.
- V315 suite: PASS.
- Live-only PostgreSQL checks: SKIPPED when `DATABASE_URL` is absent.
- Live payment/carrier providers: not claimed.
