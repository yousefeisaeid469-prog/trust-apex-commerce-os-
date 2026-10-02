# V289 — FBA Inventory Economics

## Implemented
- Durable seller enrollment into fulfillment programs.
- Fulfillment inventory reservation records tied to a fulfillment order.
- Checkout-reservation binding prevents double-reserving warehouse inventory.
- Dispatch consumes reserved/on-hand warehouse units atomically under row locks.
- Durable inventory movement records for PICK/SHIP and expanded movement taxonomy.
- Fulfillment cost ledger for PICK_PACK charges with idempotency.
- Authenticated `/api/fulfillment/fba` surface for enrollment, reservation and dispatch.

## Boundaries
- External carrier execution and warehouse hardware integrations remain provider boundaries.
- Storage billing is modeled durably but periodic metering still requires a scheduler/worker.
- Full application build/typecheck requires the project's dependency environment/database configuration.
