# TRUST APEX OS — V323

V323 closes the financial control loop with executable reconciliation rather than another documentation-only audit layer.

### Delivered
- `trust_financial_close_runs` and `trust_financial_close_items`.
- `runFinancialClose()` checks settlement arithmetic, successful refund ledger postings, paid payout postings, and provider payout settlement matching.
- `/api/finance/financial-close` exposes operational close runs for admin/operations.
- `/api/finance/payout-events` completes the existing payout state machine and seller-balance accounting from provider events.
- Migration 161 is additive and contiguous.

### Reality boundary
Source-level tests are executed in the archive. Live PostgreSQL, payment-provider, and payout-provider E2E require real deployment infrastructure and credentials; those are not fabricated by this release.
