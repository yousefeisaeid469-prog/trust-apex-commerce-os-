# TRUST V284.0.0 — Seller Financial Loop

## Delivered
- Durable seller balance release on delivered orders.
- Idempotent payout requests with available-balance checks and held funds.
- Payout outcome handling with failure/reversal restoration.
- Refund-driven seller settlement reversal with pending/available/held protection.
- Seller balance reconciliation runs.
- Authenticated merchant finance API.

## Integrity
- PostgreSQL row locks and unique idempotency keys are used at financial boundaries.
- Replays do not create duplicate payouts, releases, or refund reversals.

## Boundary
This is an internal financial runtime, not proof of a live bank/payout provider integration.
