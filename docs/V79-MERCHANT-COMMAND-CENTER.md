# TRUST V79 — Merchant Command Center

V79 adds a merchant-facing control plane that consumes the existing authenticated merchant APIs.

## Included
- `/merchant-os` dashboard
- merchant overview KPIs
- product search/listing
- batch inventory updates (max 200 items/request)
- merchant order view
- derived merchant analytics endpoint
- ownership checks through the authenticated merchant session

## Runtime note
The current catalog, merchant profiles, sessions, and orders still use in-memory stores. The UI and API contracts are designed so a persistent adapter can replace those stores later.
