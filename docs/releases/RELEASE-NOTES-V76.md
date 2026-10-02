# TRUST V76 — Merchant Onboarding & Tenant Foundation

## Changes
- Added merchant profile store and onboarding API.
- Added authenticated merchant onboarding flow with role promotion from customer to merchant.
- Added merchant profile lookup by current user.
- Added user lookup/update primitives to the identity store.
- Added merchant slug persistence/index to the PostgreSQL schema.
- Preserved the existing V75 identity/commerce bridge.

## Important runtime note
The default merchant and identity stores remain in-memory. PostgreSQL schema and repository boundaries are prepared for a real durable adapter, but no external database credentials are bundled.
