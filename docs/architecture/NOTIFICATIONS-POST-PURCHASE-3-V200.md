# TRUST V200 — Notifications + Post-Purchase 3.0

## Goal
Turn post-purchase messaging into a durable, tenant/customer-scoped delivery boundary instead of process-local notification state.

## Architecture
- `platform_notifications` remains the durable notification record.
- V200 adds delivery lifecycle fields: `QUEUED`, `PROCESSING`, `SENT`, `FAILED`, `SUPPRESSED`.
- `trust_notification_preferences` stores per-customer, per-channel, per-topic preferences.
- Order creation and customer cancellation enqueue lifecycle notifications inside the same PostgreSQL transaction.
- Dedupe is deterministic: `order:{orderId}:{topic}:{channel}` and enforced by the existing unique key.
- `IN_APP` delivery is handled by the platform worker without an external provider.
- Email/SMS/WhatsApp remain explicit provider adapter contracts. No fake provider success is reported when no adapter is configured.
- The customer API is authenticated and uses `no-store` responses.

## Channels
`IN_APP`, `EMAIL`, `SMS`, `WHATSAPP`.

## Safety boundaries
- Only allowlisted order topics can be queued.
- External delivery requires an injected `NotificationAdapter`.
- Missing adapter or destination becomes an explicit failure state.
- No provider credentials are stored in client code.

## Worker
Run `node --experimental-strip-types scripts/notifications_worker.mjs` in a scheduled/background worker environment. The worker claims records using PostgreSQL row locking and does not rely on process-local queues.

## Production boundary
A real deployment still needs provider-specific adapters, credentials, DNS/domain configuration, deliverability controls, rate limits, monitoring, and end-to-end tests against sandbox/live providers. V200 does not claim live Email/SMS/WhatsApp delivery by itself.
