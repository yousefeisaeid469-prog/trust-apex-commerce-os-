# V378 — Learning Policy Engine

V378 makes V377's LEARN stage operational without creating a second business authority.

## Implemented
- Durable learning evidence aggregation from real V377 automation outcomes.
- Deterministic policy eligibility: minimum 3 verified samples and failure rate <= 20%.
- Policy lifecycle: PROPOSED -> ACTIVE or PAUSED.
- Owner-authenticated promotion/pause operations.
- V377 plan creation now records learned policy state, revision, and evidence.
- Existing V373/V375 recovery authorities remain the only bounded business execution path.
- No direct payment, inventory, fulfillment, settlement, or revenue mutation.

## Verification boundary
Static/runtime-shape tests and migration/version gates can be executed in the repository. A live PostgreSQL integration test still requires installed dependencies and a real database.
