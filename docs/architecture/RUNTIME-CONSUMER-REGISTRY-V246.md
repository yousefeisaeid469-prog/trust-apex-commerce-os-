# TRUST V246 — Runtime Consumer Registry

V244 created the consumer-mesh persistence schema, but the initial runtime still depended on static TypeScript definitions for fan-out and retry policy. V246 closes that gap.

## Runtime authority

- `trust_consumer_subscriptions` controls enabled consumers, event subscriptions, contract version, and retry limits.
- `trust_event_schema_versions` controls registered event contract versions and lifecycle state.
- `trust_commerce_events.schema_version` records the contract version used by each durable event.

## Execution flow

```text
Business Transaction
  -> transactional outbox
  -> appendEventTx
  -> validateEventContractTx
  -> durable event + schema_version
  -> database subscription query
  -> event deliveries
  -> consumer loads subscription
  -> exact contract-version check
  -> bounded retry / dead letter
```

## Why this is different from V244

The V244 tables are no longer decorative persistence. Runtime code now reads and writes them through `modules/platform/commerce-events/registry.ts`. The publisher no longer uses `CONSUMER_DEFINITIONS` to decide who receives an event, and the worker no longer treats the static definition's retry limit as authoritative.

## Safety boundary

Contract mismatch and missing/inactive schemas fail closed. A consumer cannot acknowledge a delivery when its configured contract version does not match the event's persisted schema version.
