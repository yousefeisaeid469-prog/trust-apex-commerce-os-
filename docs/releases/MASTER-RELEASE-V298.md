# TRUST V298.0.0 — Global Checkout Runtime Integration

## Delivered
- Authenticated global checkout quote endpoint.
- Country, locale, settlement currency, shipping mode, FX and tax are persisted with the quote.
- Global quote is consumed atomically during order creation.
- Order receives a V298 pricing snapshot and global commerce metadata.
- Target-currency unit prices are persisted on order items.
- Inventory and offer stock are reserved/consumed inside the same transaction.
- Fulfillment shipment routing from the marketplace plan is attached to the global order.
- CARD/COD capability checks are enforced; wallet/bank providers remain explicit integration boundaries.
- Idempotent global commit path.

## Verification boundary
Local contract/unit checks validate arithmetic, artifacts and wiring. A live PostgreSQL/payment-provider E2E run is not claimed unless the required production dependencies and credentials are present.
