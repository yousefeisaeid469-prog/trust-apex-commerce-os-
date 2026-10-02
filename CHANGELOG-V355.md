# V355 — Commerce Execution Kernel

## Production change
- Adds a durable operational step ledger for the standard commerce execution run.
- Payment capture, fulfillment preparation, fulfillment progress, delivery finalization, settlement release and completion now have explicit resumable step identities.
- Adds a recovery runtime that resumes from committed state instead of blindly replaying side effects.
- Running steps are protected from immediate duplicate execution; completed steps are replay-safe.
- Blocked/failed steps retain a concrete error code and structured result for the next worker/operator attempt.
- Existing payment, inventory, fulfillment and settlement authorities remain the source of truth; V355 coordinates them rather than duplicating their accounting logic.

## Verification boundary
Source-level tests and migration integrity validate the implementation. Live PostgreSQL/provider execution still requires a configured production-like environment.
