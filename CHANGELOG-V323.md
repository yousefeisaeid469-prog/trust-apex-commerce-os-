# V323 — Financial Close & Payout Completion

## Implemented
- Durable financial close runs and per-entity close checks.
- Settlement gross-to-component invariant checks.
- Successful-refund-to-marketplace-ledger checks.
- Paid-payout-to-marketplace-ledger checks.
- Provider payout settlement reconciliation checks.
- Real payout provider event API wired to the existing seller-balance/payout transaction path.
- Idempotency and row locking retained.

## Verification
- V323 source test passes.
- Migration sequence remains contiguous through 161.
- Full PostgreSQL/provider E2E still requires deployment credentials and a live database/provider.
