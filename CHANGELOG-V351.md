# V351 — Financial Integrity Reconciliation

V351 adds a concrete seller-money reconciliation runtime. It is intentionally diagnostic: it detects drift and records durable findings without silently mutating balances.

## Runtime
- `modules/marketplace/financial-integrity.ts`
- Balance-vs-ledger drift detection using balance-changing ledger entries.
- Payout overallocation detection against released/refunded seller-order economics.
- Active payout-hold vs pending-payout drift detection.
- Seller-order payout allocation drift detection.
- Durable run lifecycle: RUNNING → SUCCEEDED / FAILED.
- Idempotent runs and durable findings.

## API
- `GET /api/finance/seller-integrity-reconciliation`
- `POST /api/finance/seller-integrity-reconciliation`
- Admin/operations only.
- Requires idempotency key for mutation/run requests.

## Database
- Migration `183_v351_financial_integrity_reconciliation.sql`
- Durable reconciliation findings with severity, expected/observed values, delta and evidence JSON.
- Reconciliation runs now retain merchant/currency/start/error metadata.

## Verification
- `tests/v351-financial-integrity-reconciliation.test.mjs`
