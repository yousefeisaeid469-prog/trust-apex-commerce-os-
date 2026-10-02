# V346 — Seller Dispute Cases

Implemented a real seller-scoped customer dispute/claim workflow tied to seller orders and optional order items.

- customer-owned dispute creation with seller-order/item validation
- seller-scoped financial holds with HOLD/RELEASE/CHARGEBACK ledger entries
- evidence records and immutable event history
- customer and merchant/operations APIs with ownership enforcement
- idempotent creation and transitions
- migration 178; migration sequence remains contiguous
