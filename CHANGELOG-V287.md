# TRUST V287.0.0 — Financial Architecture Correctness

- P0: deterministic immutable dispute allocations are created from actual seller settlement credits at dispute opening. LOST disputes refuse to resolve without a complete allocation and seller balance.
- P0: exposed production API surfaces for dispute operations, payout reconciliation workflows, and seller statements.
- P1: payout reconciliation now supports OPEN → INVESTIGATING → EVIDENCE_REVIEW → ADJUSTMENT_PENDING → RESOLVED.
- P1: provider event IDs are first-class replay keys; identical repeats replay safely and payload changes fail closed.
- P1: payout requests require requested currency to match the seller balance currency.
- Ledger correctness: PLATFORM_FEE and CUSTOMER_CHARGE are platform/customer-owned rows and cannot carry merchant ownership. Seller-owned financial rows require merchant ownership.
- Legacy incorrectly-owned PLATFORM_FEE rows are normalized during migration 125 before the ownership constraint is enforced.
- Added immutable dispute allocation trigger and seller-balance currency immutability trigger.
- Added payout reconciliation actions and adjustment ledger support.
