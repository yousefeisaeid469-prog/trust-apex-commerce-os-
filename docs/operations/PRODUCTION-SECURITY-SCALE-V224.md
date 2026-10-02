# V224 Operations

Before production rollout:

1. Set `TRUST_RATE_LIMIT_BACKEND=shared` and configure the shared store implementation.
2. Apply migration 075.
3. Run `npm run security-scale-hardening-v224` and `npm run dependency-audit-v224`.
4. Treat any FAIL as a release blocker.
5. Plan nonce-based CSP migration before removing the current compatibility warning.
