# TRUST V163 — Marketplace Offers & Variant Engine

V163 adds the marketplace primitives needed for a multi-seller catalog: seller-offer ranking, variant selection, and fail-closed inventory reservation.

## Added
- Best-offer ranking across price, seller rating, handling time, delivery speed, stock and condition.
- Variant selection by attributes with inactive/out-of-stock rejection.
- Expiring inventory reservations with strict quantity and TTL validation.
- Deterministic tie-breaking toward lower price.

## Integrity
This is an engine layer, not a claim that live Amazon/Temu/Shein-scale carrier, payment, seller, or inventory networks exist locally. Production deployment still requires real databases, payment providers, carriers, tax engines and seller integrations.

## Shopping intelligence
V163 also adds explainable price history/statistics, explicit target-price alerts, persistent-interest primitives, and a "Help Me Decide" scorer. These are provider-neutral primitives; notifications, live price feeds and agentic purchasing still require real production integrations and user authorization.
