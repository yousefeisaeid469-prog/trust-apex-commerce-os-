# TRUST V120 — Security & Compliance Baseline

## API hardening
- Global API rate limiting middleware with stricter buckets for payments, admin, merchant, agents and platform control routes.
- Strict production CORS allowlist via `TRUST_ALLOWED_ORIGINS`.
- Mutating browser API requests with an unapproved Origin are rejected; signed webhooks remain exempt from browser CORS enforcement.
- Security response headers are centralized in `middleware.ts` and `next.config.mjs`.
- Payment webhook signatures remain mandatory and should use a provider-specific secret.

## Production requirements
- Move rate-limit state to Redis/KV for multi-instance deployments.
- Use a managed WAF/CDN and centralized identity provider for enterprise deployments.
- Rotate admin/payment/webhook secrets and keep them outside source control.
- Run OWASP ASVS/API Top 10 review before production launch.
