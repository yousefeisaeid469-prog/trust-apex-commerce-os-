# V353 — Fulfillment Allocation Authority

## Real runtime changes
- Added `trust_fulfillment_allocations` as the durable binding between inventory reservation, exact order item, seller order, fulfillment order, merchant, offer, product and fulfillment location.
- Added `order_item_id` to inventory reservations so checkout no longer requires product/quantity reconstruction to identify the reserved line.
- Added a uniqueness guard so one inventory reservation can only be allocated once.
- Added allocation lifecycle state and timestamps.
- Added reservation release/expiry synchronization so active allocations cannot remain falsely active after inventory is released.
- Wired normal and global checkout to persist the exact order-item ID into the reservation.
- Wired fulfillment-order creation to allocate its reservations atomically in the same PostgreSQL transaction.
- Fulfillment execution now verifies allocations are active before PICKING and advances allocation state with fulfillment state.
- Legacy reservations without an order-item link are resolved only when there is exactly one unambiguous candidate; ambiguous history fails closed.

## Verification boundary
- Source-level V353 regression test added.
- Migration remains contiguous and must be validated with the canonical migration checker.
- No live PostgreSQL or external fulfillment provider execution is claimed by this release.
