# TRUST V306.0.0 — Global Logistics Execution

- Added durable V306 global logistics execution jobs and attempt ledger.
- Added V305 decision → shipment execution bridge with idempotency.
- Added leased worker execution with bounded retries and terminal failure state.
- Added deterministic in-process `TRUST-E2E` label generation for executable sandbox proof.
- Added shipment label/tracking/outbox integration.
- Added global logistics execution API and audit/test coverage.
- Live carrier connectivity remains an explicit integration boundary.
