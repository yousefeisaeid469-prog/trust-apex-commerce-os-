# TRUST V78 — Merchant Commerce Operations

## Added
- Merchant-scoped order visibility derived from products owned by the authenticated merchant.
- Merchant inventory update endpoint with ownership validation and stock bounds.
- Merchant operations service boundary separating merchant workflows from core catalog data.
- No client-supplied merchant identity is trusted for authorization; merchant identity is resolved from the authenticated session.

## Verification
- Static release audit and import preflight should be run with `npm run audit` and `npm run prebuild`.
- Full `next build` requires dependencies to be installed in the target environment.

## Production note
The current catalog/auth/order stores remain in-memory. PostgreSQL/payment providers must be connected before production launch.
