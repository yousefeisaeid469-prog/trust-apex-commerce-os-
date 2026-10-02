# TRUST V80 — APEX CUSTOMER COMMERCE

## Major release
- Customer-owned cart store with add/update/replace/clear semantics.
- Cart pricing summary with EGP shipping rules and stock-aware validation.
- Customer order read endpoint scoped to the authenticated user.
- Merchant-owned order status transition endpoint with ownership enforcement.
- New Customer Commerce OS at `/customer-os`.
- Centralized cart logic separated from catalog and order domains.
- Customer RBAC explicitly includes checkout capability.

## Runtime note
The cart/auth/merchant stores remain in-memory adapters for development. Persistent production deployment still requires PostgreSQL (or another durable datastore), real payment provider integration, webhooks, and observability.
