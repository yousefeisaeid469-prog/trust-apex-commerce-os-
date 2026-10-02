# TRUST V231.0.0 — Commerce Execution

V231 hardens the path from durable checkout to payment evidence and merchant order execution.

## Delivered

- Canonical PostgreSQL payment-intent API; removed the API's dependency on the legacy in-memory order store.
- Provider-gated payment initiation with explicit `PROVIDER_REQUIRED` behavior when production credentials are absent.
- Durable webhook inbox integration with fingerprint validation and payment-event linkage.
- Durable merchant order state transitions with ownership checks, timeline history, notifications and outbox events.
- Migration 081 and manifest checksum registration.
- Source-level V231 regression tests.

## Not claimed

No live payment processor, carrier, production database, production traffic or external settlement is claimed merely from repository tests. Those require deployment evidence and provider-specific verification.
