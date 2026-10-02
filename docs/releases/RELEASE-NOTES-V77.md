# TRUST V77 — APEX MERCHANT PRODUCT OPERATIONS

V77 extends V76 with a real merchant-owned product management boundary.

## Included
- Merchant product listing scoped by authenticated merchant ID.
- Product creation with server-side validation.
- Product updates scoped to the owning merchant.
- Merchant overview metrics derived from its own catalog.
- No client-supplied merchant ID is trusted for ownership.
- No-store cache headers on authenticated merchant APIs.

## Verification
Static structure/import checks pass in the packaging environment.
A full `npm install` + `next build` remains an environment-dependent verification step and must be run in CI/Vercel before production release.
