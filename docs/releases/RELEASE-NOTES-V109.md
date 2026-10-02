# TRUST V109 — Fulfillment & Logistics OS

V109 extends the V108 payment/order orchestration layer with a logistics domain and a mobile-responsive operations experience.

## Added
- Carrier quote abstraction with ETA, price, carbon and confidence fields.
- Fulfillment planner supporting single-node and split-shipment strategies.
- Shipment tracking model with milestone events and ETA.
- Return eligibility policy foundation.
- `/logistics` operations experience with carrier router, warehouse allocation, tracking timeline and exception center.
- `/api/logistics/quote`, `/api/logistics/track`, `/api/logistics/shipments`.

## Important boundary
The current carrier quotes and tracking screen are demo/foundation behavior. No real carrier account, label purchase, delivery scan, or customer shipment is claimed until a provider adapter and credentials are configured.
