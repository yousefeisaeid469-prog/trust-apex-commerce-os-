# V391 — Production Commerce Hardening

## Added
- Canonical commerce lifecycle contract shared by runtime and database validation.
- PostgreSQL production integration lab using an isolated temporary schema.
- Concurrency test for inventory reservation using row locking.
- Idempotency replay test with a database uniqueness boundary.
- Payment webhook replay protection test.
- Outbox deduplication test.
- Settlement rollback and retry test.

## Verification
- PostgreSQL integration audit: PASS (wiring/static audit).
- V391 release gate: PASS.
- Live PostgreSQL integration execution: requires `DATABASE_URL`; the build environment used to package this release did not provide a live database endpoint, so no live DB result is claimed.
