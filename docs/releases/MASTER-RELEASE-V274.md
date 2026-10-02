# TRUST V274 — Intelligent Marketplace Checkout

V274 turns the V272 offer + V273 fulfillment primitives into a checkout-time decision surface.

## Product/runtime changes
- Builds a server-authoritative fulfillment plan for every marketplace checkout line.
- Resolves the selected Buy Box offer when a cart line does not explicitly name an offer.
- Chooses a concrete fulfillment location when a durable network promise exists.
- Consolidates compatible lines into shipment legs so a shared route is not charged repeatedly.
- Persists the exact split-shipment plan on the checkout quote and order.
- Reserves the selected fulfillment-location inventory inside the checkout transaction.
- Keeps a bounded offer-level fallback for merchants that have not configured a network route yet; the fallback never invents a location.
- Adds a dedicated checkout planning API.
- Wires the production checkout commit route to bind Buy Box-selected offers before order creation, so an offer-less cart cannot silently fall back to the canonical product price.
- Fixes cart totals so offer prices and offer stock are reflected instead of the canonical product price.
- Fixes the Buy Box deterministic price tie-breaker.

## Verification boundary
Targeted V274 tests cover shipment consolidation, fallback behavior, and deterministic ordering. Migration/version/release gates are intended to run in the release environment. A full Next.js production build is not claimed when dependencies are absent.

TRUST is not claimed to be universally better than Amazon by this release. The goal is a real, measurable marketplace runtime rather than feature-name parity.
