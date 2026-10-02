# TRUST APEX OS V210 — Global Commerce Graph

V210 adds a provider-neutral graph layer over existing commerce signals. It connects products, merchants, customers, orders, offers and post-purchase problems using only observed relationships.

## Design goals
- One explainable relationship layer for Marketplace Intelligence, Growth Network, Commerce AI Copilot and Super App surfaces.
- Deterministic output suitable for tests and audit.
- No invented relationships, prices, stock, delivery promises or revenue.
- Monetization opportunities remain recommendations; execution stays behind existing adapters, permissions and approvals.
- No new database migration: V210 is a stateless graph projection over current data.

## Graph semantics
- Product → Merchant: `SOLD_BY`
- Customer → Order and Order → Product: `BOUGHT_IN`
- Product ↔ Product: `CO_PURCHASED`
- Product → Offer: `HAS_OFFER`
- Customer/Order → Problem: `HAS_PROBLEM`
- Problem → Product: `RELATED_TO`

## Integration boundary
The graph is intentionally provider-neutral. It can later be backed by PostgreSQL, event streams, search indexes or a graph database without changing the decision contracts.
