# V327 — Commerce Execution Runtime

## What changed
- Added durable `trust_commerce_execution_runs` operational state for standard marketplace orders.
- Payment capture now starts standard-order fulfillment execution in the same database transaction.
- Delivery tracking now completes standard fulfillment orders, transitions the order to delivered, releases seller settlement, and closes the execution run.
- Existing global-order orchestration remains intact; global orders continue through the global execution path.
- All transitions use row locks and idempotent event keys.

## Boundary
This is runtime code, not a claim that external payment/carrier providers are configured. Provider integration still depends on deployment credentials/webhooks.
