# V352 — Unified Inventory Reservation Authority

V352 closes a real commerce consistency gap: the legacy checkout path and the global checkout path each implemented their own stock decrement + reservation logic. That made V328's reservation lifecycle non-authoritative across checkout surfaces.

## Runtime
- `modules/commerce/inventory/reservations.ts`
  - Adds `reserveInventoryTx()` as the single transactional reservation primitive.
  - Locks the exact product/offer inventory bucket with `FOR UPDATE`.
  - Validates active offer/product and stock atomically.
  - Supports fulfillment-location inventory.
  - Creates the durable reservation and inventory ledger entry in the same transaction.
  - Emits `RESERVED` for card/pending checkout and `CONSUMED` for COD checkout.
  - Correctly handles fulfillment `reserved_units`: COD consumption does not create a reservation count that later needs to be decremented.
- `modules/commerce/transactions/checkout.ts`
  - Removes duplicate stock decrement/reservation implementation.
  - Uses the unified reservation authority.
- `modules/commerce/transactions/global-checkout.ts`
  - Removes the global checkout stock bypass.
  - Uses the same reservation authority as normal checkout.

## Database
- Migration `184_v352_unified_inventory_reservation.sql`.
- Adds indexes for order/offer/location reservation lifecycle queries.
- 184 canonical migrations remain contiguous and checksum-compatible.

## Verification
- `tests/v352-unified-inventory-reservation.test.mjs`
- V348 payout protection: PASS
- V349 payout provider execution: PASS
- V350 payout webhook reconciliation: PASS
- V351 financial integrity reconciliation: PASS
- V352 unified inventory reservation: PASS
- Migration check: PASS — 184 canonical migrations.
- TypeScript syntax checks passed for the changed reservation/checkout modules.

## Important verification boundary
No live PostgreSQL or external provider execution is claimed by this release. The verified scope is source-level regression coverage, migration integrity, and TypeScript syntax for the changed runtime modules.
