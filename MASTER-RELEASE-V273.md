# TRUST V273 — Trust Fulfillment Network

V273 turns delivery from a static offer field into a durable fulfillment network.

- Multiple sellers remain supported per canonical product; the V272 product uniqueness constraint is removed.
- Durable fulfillment locations and per-offer inventory are introduced.
- Durable origin→destination shipping lanes are introduced.
- Delivery promises bind an offer to a fulfillment location, destination region, inventory availability, shipping cost and fulfillment cost.
- Deterministic fulfillment ranking prefers speed, total fulfillment economics and available inventory.
- `GET /api/marketplace/fulfillment?offerId=...&region=...&qty=...` exposes the resolved delivery option.
- No audit-only work was added; this release expands customer/merchant commerce runtime.

Verification: targeted V273 fulfillment tests pass; migration/version/release gates should be run in the release environment. Full Next/TypeScript build is not claimed when dependencies are absent.
