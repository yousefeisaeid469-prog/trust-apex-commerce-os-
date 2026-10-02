# TRUST APEX OS — V182 Purchase Guardian

V182 adds a durable post-purchase lifecycle layer so customers can manage what happens after checkout instead of treating an order as the end of commerce.

## Delivered
- Customer-scoped Purchase Guardian API and UI.
- Purchase Passport model for order + item lifecycle data.
- Return-window and warranty attention engine.
- PostgreSQL indexes and durable guardian event table.
- Explicit warranty-event derivation instead of invented warranty data.
- Checkout canonical import correction carried forward from V181.

## Verification
- V182 deterministic tests cover return-window alerts, warranty alerts and out-of-window behavior.
- Migration manifest checksum updated and verified.
- No claim is made of universal retailer integrations, live PSP/carrier connectivity, production traffic, browser E2E, or live PostgreSQL execution unless separately provisioned.
