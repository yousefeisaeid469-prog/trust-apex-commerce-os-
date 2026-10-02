# TRUST V168 — Global Supply Chain Intelligence

V168 adds a deterministic supply-chain decision layer for demand forecasting, replenishment, supplier ranking, purchase orders, landed-cost accounting, and inventory allocation.

## Principles
- BigInt minor-unit arithmetic for money.
- Fail-closed supplier eligibility for critical-risk suppliers.
- Deterministic tie-breaking for repeatable decisions.
- No fabricated FX, carrier, customs, supplier, or external fulfillment claims.
- Durable PostgreSQL primitives are separated from decision logic so real integrations can be attached without changing policy semantics.
