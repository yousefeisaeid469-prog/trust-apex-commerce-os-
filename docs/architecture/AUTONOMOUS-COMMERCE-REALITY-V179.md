# TRUST V179 — Autonomous Commerce Reality Layer

V179 replaces legacy name-only autonomy helpers with executable, testable domain logic.

## Core changes
- Agent registry validates tenant identity, capabilities, trust score and status.
- Autonomy firewall evaluates capability, tenant, risk ceiling, confidence, reversibility and budget.
- Next-best-action ranks only valid candidates using impact, confidence, cost, risk and reversibility.
- Fraud Shield computes a bounded multi-signal score and exposes explainable risk classification.
- Autonomous Fabric page derives health, autonomy, inventory value, ratings, fraud posture, agent state and product recommendations from structured data.
- Checkout now has a canonical database-backed `createOrder` boundary and the API route uses it; order creation remains transactional and idempotent.
- V179 persists agent registrations, autonomy decisions and fraud assessments for an auditable production boundary.

## Honesty boundary
Local tests validate deterministic semantics. They do not prove production PostgreSQL connectivity, payment-provider authorization, carrier integrations, browser E2E, or distributed deployment behavior.
