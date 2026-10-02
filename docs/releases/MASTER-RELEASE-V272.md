# TRUST V272.0.0 — Marketplace Offer Graph + Buy Box

V272 moves the marketplace from single-listing discovery toward a real multi-offer commerce surface.

## Product/runtime changes
- Canonical marketplace catalog items group merchant offers around a shared catalog identity.
- Durable seller offers include price, stock, fulfillment mode, shipping fee, seller rating, delivery promise, and return-rate signal.
- Deterministic Buy Box resolution selects an in-stock offer using price, seller quality, fulfillment, delivery, availability, and returns.
- Customer product pages expose competing offers and allow the customer to add the selected offer to the durable cart.
- Selected offers flow through pricing and durable checkout; the order item records the winning offer and offer stock is decremented transactionally.
- A seller API can create an offer for a merchant-owned product.

## Guardrails
- No automatic promotion/approval behavior was added.
- Existing V269 productivity-loop guard remains in force.
- Private signing keys remain outside the application/database.

## Verification
- V272 Buy Box tests cover ranking, deterministic tie-breaking, offer binding, and migration presence.
- V271 remains covered as a historical regression.
- Full Next.js build/typecheck requires installed dependencies and a configured runtime/database; this release does not claim those environment-dependent checks were run.
