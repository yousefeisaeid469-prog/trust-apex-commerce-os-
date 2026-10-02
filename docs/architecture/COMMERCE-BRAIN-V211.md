# Commerce Brain V211

V211 adds a deterministic, event-driven signal layer over the Global Commerce Graph. It accepts commerce events, deduplicates them by idempotency key, derives bounded operational signals, marks stale evidence as UNKNOWN, and emits non-executing next-best actions.

## Event boundary
Supported event types include product, price, stock, offer, order, shipment, problem, purchase, return, and refund changes. Events must carry tenant, aggregate, timestamp, version, event ID, and idempotency key.

## Freshness
Every derived signal contains `asOf` and `staleAfter`. The snapshot reports the latest event timestamp, event lag, and unknown signal count. The system never labels an empty input as live.

## Execution boundary
The brain does not authorize or execute payment, refund, fulfillment, messaging, or other sensitive actions. It only points to existing product surfaces where the appropriate authorization/approval boundaries apply.
