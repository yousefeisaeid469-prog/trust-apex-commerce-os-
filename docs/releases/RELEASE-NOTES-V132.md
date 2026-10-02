# TRUST V132 — Transactional Hardening

V132 preserves the V131 feature surface and hardens the highest-risk runtime boundaries.

## What changed
- Atomic checkout idempotency using the order uniqueness boundary, with request fingerprints to prevent accidental key reuse across different commands.
- Conflict-safe payment creation and refund creation under concurrent retries.
- Atomic payment webhook event deduplication using the provider/event uniqueness boundary.
- Worker lease tokens, lease renewal, and expired-lease recovery for durable jobs.
- Strictly positive payment amount constraints at the database boundary.
- Durable request fingerprints and operational indexes.
- Added V132 invariant tests without deleting historical V129–V131 artifacts.

## Verification
- 25 automated tests PASS.
- 23 canonical migrations PASS with checksum manifest compatibility.
- Release Gate PASS.
- Deployment Smoke PASS.
- Contract Check PASS.
- Parity Check PASS.
- Release Audit PASS.

## Honest boundary
This release still does not claim live third-party provider, browser E2E, load, disaster-recovery, or canary validation unless those tests are executed against the corresponding real environment.
