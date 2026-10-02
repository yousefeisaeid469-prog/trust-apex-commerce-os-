# TRUST APEX OS — Order Experience 3.0 (V199)

V199 turns post-purchase order handling into a durable, database-backed customer experience.

## Capabilities
- DB-backed customer order history (latest 50 orders per account).
- DB-backed order detail with line items, payments, status timeline and safe actions.
- Durable `trust_order_status_history` audit trail.
- Initial status is recorded atomically with checkout commit.
- Migration backfills one initial history row for existing orders that have no history.
- Customer cancellation for `pending` and `confirmed` orders only.
- Cancellation is serialized with a PostgreSQL transaction advisory lock, locks the order/reservations, restores stock, writes an inventory ledger entry, changes status, appends history, and emits an outbox event.
- Explicit action policy prevents cancellation after processing/shipping/delivery/refund.
- Mobile-first order list/detail surfaces with recovery states.

## Production boundary
The application is prepared for deployment but external carrier tracking, customer notification providers, and live card-provider operations still require real credentials/adapters and production verification. V199 does not claim live traffic or external fulfillment connectivity merely because the internal contracts exist.
