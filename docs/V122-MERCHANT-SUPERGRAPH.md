# TRUST V122 — Merchant Supergraph

V122 turns the Global Commerce Network into a graph-oriented routing foundation. Merchant nodes, product/offer edges, regional service edges and reputation signals can be combined to choose an eligible offer without treating price as the only objective.

## Routing invariants
- Suspended or pending sellers are never purchasable.
- Offers must be verified and have sufficient quantity.
- Currency and region boundaries are explicit.
- Live ETA, FX, tax, carrier and settlement data are never fabricated.
- Routing reasons are returned for explainability.

## Production boundary
The in-memory graph is a deterministic foundation. Production should persist graph nodes/edges and routing decisions in PostgreSQL, then add provider-backed inventory, carrier, FX, tax and seller-verification adapters.
