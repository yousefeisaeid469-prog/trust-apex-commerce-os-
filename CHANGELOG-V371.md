# V371 — Verified Commerce Recovery Loop

- Added `modules/platform/durable-events/recovery-loop.ts`.
- Adds bounded automatic recovery for stale consumer leases and stale commerce execution leases.
- Re-observes the command center after recovery and records a verified/unverified postcondition.
- Adds durable `trust_commerce_recovery_runs` via migration 200.
- Adds `/api/cron/commerce-recovery-loop` as a recovery safety-net trigger; continuous workers remain standalone.
- Adds current-head audit and smoke test.
- No direct mutation of customer balances, payments, payouts, inventory ownership or order state.
- Live PostgreSQL/provider execution is not claimed without a configured database.
