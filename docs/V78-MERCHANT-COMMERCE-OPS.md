# V78 Merchant Commerce Operations

V78 connects merchant identity to operational workflows.

## Boundaries
- `modules/commerce/merchant-ops/service.ts`: merchant-scoped order and inventory operations.
- `app/api/merchant/orders/route.ts`: authenticated merchant order view.
- `app/api/merchant/inventory/route.ts`: authenticated merchant stock mutation.

## Security invariant
Merchant IDs are resolved from the authenticated session and never accepted from the browser as an authorization source.

## Next production step
Replace in-memory catalog/order/auth stores with transactional PostgreSQL adapters and add integration tests for concurrent inventory updates.
