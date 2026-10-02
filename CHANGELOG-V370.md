# V370 — Unified Commerce Command Center

- Added `modules/platform/durable-events/command-center.ts`.
- Correlates V369 Operations Brain state with recent durable-event failure signals.
- Adds deterministic, evidence-backed root-cause classification and bounded recovery plans.
- Adds durable `trust_commerce_command_center_snapshots` via migration 199.
- Adds `/api/health/commerce/command-center`.
- Adds current-head audit and smoke test.
- No direct mutation of customer balances, payments, payouts, inventory ownership or order state.
- Live PostgreSQL/provider execution is not claimed without a configured database.
