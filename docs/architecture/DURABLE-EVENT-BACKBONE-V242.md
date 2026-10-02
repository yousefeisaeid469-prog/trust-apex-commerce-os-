# TRUST V242 — Durable Event Backbone

V242 promotes the existing commerce-event tables into a durable execution boundary that can be horizontally worker-scaled per cell.

## Guarantees

1. **Tenant idempotency** — `(tenant_id, idempotency_key)` is unique at the database layer.
2. **Aggregate ordering** — sequence allocation is serialized by a PostgreSQL transaction advisory lock per tenant/aggregate.
3. **Cell affinity** — append operations route to the deterministic cell for the tenant before opening the database transaction.
4. **Leased delivery** — workers claim due deliveries with `FOR UPDATE SKIP LOCKED`; stale leases can be reclaimed.
5. **Bounded retry** — delivery failures use exponential backoff and transition to `DEAD_LETTERED` after the configured attempt limit.
6. **Effect idempotency** — business effects can be protected by `(tenant_id, effect_key)`.
7. **No silent success** — a worker with no registered handler retries/dead-letters the delivery instead of reporting success.

## Horizontal deployment model

```text
                 Tenant
                    |
             deterministic cell
                    |
        +-----------+-----------+
        |                       |
   API / producer         Worker fleet
        |                       |
        +------ PostgreSQL -----+
                event log
              delivery state
              effect ledger
              dead letters
```

Workers are stateless. Multiple workers may safely run the same consumer because delivery claims use row locks and stale leases.

## Production boundary

The event store is real PostgreSQL-backed infrastructure. It does not claim that a multi-region Kafka/Pulsar-style fabric exists. If traffic eventually exceeds PostgreSQL event-log capacity, the durable schema provides the correctness boundary from which a partitioned broker adapter can be introduced without weakening idempotency or delivery semantics.
