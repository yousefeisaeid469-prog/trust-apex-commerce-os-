# TRUST V287.0.0 — Financial Architecture Correctness

V287 closes the critical V285/V286 financial architecture gaps: disputes now have deterministic immutable multi-seller allocations, payout reconciliation has a durable investigation/evidence/adjustment workflow, provider events replay safely, payout requests enforce seller-balance currency, and platform fee ledger entries are platform-owned rather than seller-owned.

## Production API surfaces

- `/api/finance/disputes` — operations/admin open and resolve dispute cases.
- `/api/finance/payout-reconciliation` — operations/admin reconcile provider events, advance mismatch investigations, and resolve approved adjustments.
- `/api/merchant/finance/statements` — authenticated seller statement generation and retrieval.
- `/api/merchant/finance` — existing seller balance and payout request surface remains live.

## Runtime boundary

TRUST still requires real payment providers, payout rails, tax services, and carrier integrations for external money movement. V287 does not claim those external integrations are certified.
