# V401 — Global Inventory Execution Truth

## Real implementation
- Added PostgreSQL read authority `trust_inventory_execution_truth`.
- Aggregates warehouse `on_hand`, `available`, `reserved`, `inbound`, `damaged` state.
- Correlates checkout reservations and fulfillment allocations with physical execution.
- Exposes committed, delivered, shipped and returned quantities.
- Detects the warehouse invariant `available + reserved = on_hand` and legacy offer-stock conflicts.
- Restored the full inventory movement type contract including `PICK`, `SHIP`, `RETURN_RECEIPT`, and `STORAGE_ADJUSTMENT`.
- Cart offer availability now reads the execution-truth authority when fulfillment inventory exists.
- Reorder now preserves the original offer binding and uses execution-truth availability.
- Added `GET /api/inventory/execution/[productId]` with optional `offerId`.
- Added a DB-aware verifier which reports `SKIP` when PostgreSQL is not configured.

## Verification
- `npm run migration-check` — PASS, 226 canonical migrations.
- `npm run release-gate` — PASS.
- `npm run inventory-execution-truth` — SKIP because no real PostgreSQL connection was configured.
- `npm run typecheck` — not clean in this environment because the repository dependencies/types (`next`, `react`, `pg`, `@types/node`, etc.) are not installed; existing project-wide errors are therefore not evidence of a V401-specific type error.
