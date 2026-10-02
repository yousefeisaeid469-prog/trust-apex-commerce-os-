# V354 — Fulfillment Inventory Execution

## Production change
- Fulfillment handoff now consumes the exact inventory represented by V353 allocations.
- Consumption is locked, quantity-checked, idempotent, and recorded by an immutable execution receipt.
- `SHIP` inventory movements are now first-class.
- Card/online reservations decrement `reserved_units` + `on_hand_units`; COD reservations decrement `on_hand_units` only because V352 intentionally does not increment `reserved_units` for COD.
- No fulfillment handoff can complete if an allocation is missing, released, expired, cancelled, unpacked, or lacks physical inventory.

## Verification boundary
Source-level tests and migration integrity validate the implementation. Live PostgreSQL/provider execution still requires a real configured environment.
