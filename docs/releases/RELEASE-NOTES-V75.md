# TRUST V75 — Identity & Commerce Authorization

## Focus
V75 connects the V74 identity/session layer to commerce authorization boundaries.

## Changes
- Added a reusable current-user resolver for HTTP-only sessions.
- Orders now require authentication.
- Customers can only read their own orders.
- Operational/support/admin roles can access broader order views according to RBAC permissions.
- Order status mutation now requires `orders:operate` permission.
- Order creation derives `customerId` from the authenticated session instead of trusting a client-supplied identity.
- Checkout responses are explicitly non-cacheable.
- Orders API is explicitly dynamic and Node-runtime compatible with the current session implementation.
- Project version is `75.0.0`.

## Important boundary
The current identity store remains in-memory. PostgreSQL schema/contracts from V74 remain the production persistence boundary, but a real database provider must still be configured before launch.
