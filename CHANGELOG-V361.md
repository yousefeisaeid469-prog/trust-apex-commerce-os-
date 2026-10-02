# V361.0.0 — Legacy Runtime Restoration

V361 removes a class of runtime gaps discovered while validating the V360 event backbone. Historical commerce modules that were still imported by production scripts/tests are restored as executable domain runtimes rather than audit-only claims.

## Restored runtime boundaries
- Super Commerce cart, loyalty, deals, review insights and seller trust.
- Advertising ranking and recommerce pricing.
- Financial commerce economics and payout helpers.
- Growth OS and growth network.
- Commerce AI Copilot with explicit non-financial execution boundaries.
- Global commerce graph.
- Commerce Brain → Control Plane → Runtime → Orchestrator path.
- Revenue Autopilot, Intelligence, Experimentation and Decision Loop.
- Autonomous commerce data-plane persistence helpers with tenant validation.
- Commerce event creation/deduplication and JSON-schema validation.
- Global Commerce V296/V297 runtime contracts.
- Fulfillment allocation runtime dependency used by fulfillment-runtime.

## Database
Migrations 190–191 are additive: runtime indexes plus a durable autonomous-orchestration acceptance ledger. No destructive or data-rewriting migration is introduced.

## Validation
The restored historical runtime contract suite was executed directly. The target 70-test subset passed after implementation. Full-suite historical tests still include version-pinned regression tests for superseded releases; those are not relabeled as current-release failures.
