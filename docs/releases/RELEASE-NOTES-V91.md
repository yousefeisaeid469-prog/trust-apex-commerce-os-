# TRUST V91 — APEX SUPER ADMIN CONTROL PLANE

V91 adds a unified administrative control surface at `/admin`.

## Scope
- Unified module inventory across commerce, operations, growth, AI, risk, experience, B2B and expansion.
- Feature flag control surface with local persistence for prototyping.
- Quick access to Merchant, Customer, Campaign, Agent, Governance and Analytics surfaces.
- Platform health link and release-control summary.
- Admin navigation grouped by domain.
- Responsive command-center UI.

## Important production boundary
The UI is a control-surface foundation. Production-wide configuration changes must be backed by authenticated server-side authorization, durable feature-flag storage, audit logging, and approval gates before they affect live infrastructure.
