# TRUST V73 — Identity & Data Core

## Added
- Identity domain types for users, roles, account status and sessions.
- RBAC permission model for customer, merchant, admin, support and operations roles.
- Session/identity provider contracts with a clean persistence boundary.
- PostgreSQL foundation schema for users, merchant profiles and sessions.
- Readiness endpoint that explicitly reports whether database/auth/payment infrastructure is configured.
- Auth/me and session-revocation API boundaries.
- Merchant profile API boundary requiring an authenticated session.

## Integrity
- No secrets are embedded in source.
- Production services remain provider-agnostic until real credentials/configuration are supplied.
- In-memory behavior is not presented as durable production storage.
