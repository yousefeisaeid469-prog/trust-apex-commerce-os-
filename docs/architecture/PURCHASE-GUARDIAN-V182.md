# TRUST APEX OS — V182 Purchase Guardian

Purchase Guardian is the post-purchase lifecycle layer. It gives an authenticated customer a durable, customer-scoped view of orders and derived attention windows.

## Core contract
- Purchase passport: order, items, amount, status and lifecycle dates.
- Return-window signal: currently derived from the platform's configured 14-day baseline.
- Warranty signal: derived only from explicit `warranty_registered` events with a numeric `warrantyDays` metadata value.
- Attention engine: deterministic alerts for return windows (7 days) and warranties (30 days).

## Security boundary
The API requires an authenticated customer session and queries only that customer's orders. It does not accept an arbitrary customer ID from the browser.

## Honest scope
V182 does not claim universal retailer ingestion, automatic policy discovery, price-protection enforcement, document OCR, or autonomous external actions. Those require additional provider contracts and explicit consent/authorization.
