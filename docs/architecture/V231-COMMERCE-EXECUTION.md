# TRUST V231 — Commerce Execution

V231 closes several real-execution gaps in checkout and payments without pretending an external provider is connected when it is not.

## Changes

- Payment-intent creation is now backed by the canonical PostgreSQL order/payment path; the legacy in-memory payment adapter is no longer used by the intent API.
- Card payment initiation is provider-gated by `PAYMENT_PROVIDER` + `PAYMENTS_PROVIDER_SECRET` and fails closed with `PROVIDER_REQUIRED` when the deployment is not configured.
- Signed payment webhooks enter the durable `trust_webhook_inbox` before payment state mutation, with provider/event fingerprint validation and processed/failed state.
- Payment events retain a foreign-key link to the webhook inbox for operational traceability.
- Merchant order status changes use the durable order state machine, merchant-product ownership checks, order history, notification queueing and transactional outbox.
- Idempotency remains request-fingerprint protected; replaying a key with a different payload is rejected.

## Reality boundary

A payment provider is still an external system. V231 does not manufacture provider authorization, capture or settlement. The application records and reconciles provider evidence only after a configured provider and signed webhook boundary exist.

A deployment must configure a real provider adapter and run provider-specific sandbox/live contract tests before enabling live money movement.
