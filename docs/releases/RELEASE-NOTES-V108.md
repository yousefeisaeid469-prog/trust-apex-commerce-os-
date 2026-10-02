# TRUST V108 — Payment + Order Orchestration

Built on V107.

## Added
- Payment intent domain and state machine.
- Signed webhook verification using HMAC-SHA256.
- Duplicate provider event protection.
- Order status synchronization from payment events.
- Idempotent refund requests with partial/full refund bounds.
- Payment/refund PostgreSQL migration.
- Server-side payment, webhook, refund and order APIs.
- Mobile-friendly orchestration overview page.

## Production requirements
- Set `DATABASE_URL` server-side.
- Set `TRUST_PAYMENT_WEBHOOK_SECRET` server-side.
- Connect a real payment provider adapter before accepting live money.
- Validate provider-specific webhook signing semantics in the adapter; the generic HMAC boundary is intentionally provider-neutral.
