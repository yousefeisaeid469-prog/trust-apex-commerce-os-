# TRUST V349 — Payout Provider Execution

## Real implementation
- Added durable `PAYOUT` provider jobs to the existing payment-provider worker queue.
- Added provider payout contract and HTTP execution against `/payouts` with idempotency keys.
- Added payout provider attempt history with unique attempt keys and provider-reference uniqueness.
- Linked payout requests to their provider job and destination account reference.
- Validated payout account activation and currency before provider execution.
- Reused the existing payout settlement state machine so `PAID` consumes the V348 eligibility hold and `FAILED`/`REVERSED` releases it.
- Terminal provider execution exhaustion fails the payout and releases its held seller funds.
- Added V349 source regression coverage.

## Verification
- `node tests/v349-payout-provider-execution.test.mjs` — PASS
- `node tests/v348-payout-protection.test.mjs` — PASS
- `node scripts/migration_check.mjs` — PASS (181 canonical migrations)
- `node --check scripts/payment_provider_worker.mjs` — PASS

## Runtime verification limitation
This release has not been represented as a live external-provider success. A real provider requires production credentials, a live payout endpoint, and an active seller payout account. The worker is wired for that execution path, but no external transfer is claimed without those live dependencies.
