# TRUST V317 — Transactional Marketplace Execution

V317 turns the V316 Marketplace OS vertical slice into one durable transactional execution path.

## Transaction boundary
A single PostgreSQL transaction owns validation, atomic offer-stock decrement, execution record creation, order/item creation, inventory reservation, sandbox payment capture record, shipment, fulfillment order, settlement, fee assessment, seller pending balance and evidence events. Any exception rolls the transaction back through the existing TRUST PostgreSQL transaction helper.

## Financial invariant
`gross order total = seller net + platform commission + fulfillment fee`.

## Replay invariant
The execution idempotency key is unique. A completed key returns the persisted result instead of creating another order, payment, reservation or settlement.

## Reality boundary
Payment capture uses the deterministic V315 sandbox adapter. V317 does not claim live PostgreSQL execution or live payment/carrier connectivity in this artifact.
