# V298 — Global Checkout Runtime Integration

- Integrated V297 Global Commerce into authenticated checkout quote/commit APIs.
- Added durable global checkout metadata and pricing snapshots.
- Added target-currency order-item pricing with integer minor-unit conversion.
- Added quote-bound price revalidation and idempotent global order commit.
- Added global payment capability enforcement for the currently supported CARD/COD order methods.
- Extended payment-intent/refund currency handling so downstream payment records follow the order currency.
- Added V298 migration, contract test, audit, release documentation, and evidence artifact.
