# TRUST V293 — Post-Sale Financial Controls

V293 moves post-sale from orchestration visibility into durable financial and inventory evidence.

## Runtime changes
- Added immutable/idempotent post-sale financial event records.
- Added refund accounting journals in the same database transaction as successful refund processing.
- Added return inventory recovery records with idempotent RESTOCK/QUARANTINE/RETURN_TO_VENDOR disposition and product stock recovery for restockable items.
- Added RETURN_RECEIPT to fulfillment inventory movement types.
- Added database-level immutability triggers for accounting journals and entries.
- Wired both return-specific and generic payment refund success paths into the financial evidence layer.

## Evidence boundary
This release hardens transaction semantics and contract coverage. It does not claim a live payment-provider, warehouse, or production database certification without those dependencies configured.
