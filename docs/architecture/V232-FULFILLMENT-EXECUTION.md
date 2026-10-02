# V232 — Fulfillment Execution

V232 turns shipment tracking from a passive event surface into a durable execution boundary.

## Guarantees
- Shipment transitions are validated against an explicit state machine.
- Transitions lock the shipment row and write the tracking event plus shipment update in one PostgreSQL transaction.
- Customer reads are restricted to the order owner; operational mutation is privileged.
- Creating a shipment refuses a second active shipment for the same order.
- Provider-created labels remain provider-boundary work; no carrier credential or fake tracking number is invented.

## Lifecycle
`PLANNED → LABEL_CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`

Exceptional paths use `EXCEPTION` and can recover into an active delivery state. Terminal states cannot move again.
