# TRUST V86 — Release Checklist

## Required before accepting production traffic
- [ ] `npm ci` succeeds from a committed lockfile in CI.
- [ ] `npm run release-gate` passes.
- [ ] `npm run build` passes in CI.
- [ ] Production PostgreSQL is provisioned and migrations are applied.
- [ ] `DATABASE_URL` is configured only server-side.
- [ ] `TRUST_SESSION_SECRET` is a high-entropy production secret.
- [ ] A real payment provider is selected and `PAYMENT_PROVIDER_SECRET` is configured.
- [ ] Payment webhook signature verification is tested against the provider's official test events.
- [ ] Shared/durable idempotency storage is enabled; in-memory idempotency is not sufficient for multi-instance production.
- [ ] Durable authentication/session storage is enabled; in-memory auth is not sufficient for production.
- [ ] Email/storage/observability providers are configured if those capabilities are enabled.
- [ ] Staging smoke tests pass: signup/login, merchant onboarding, product creation, cart, checkout, payment success/failure, webhook replay, order lifecycle, inventory reservation/release, returns and reviews.
- [ ] Backup/restore and rollback procedure is tested.

## Important
Passing static audits does not prove that third-party services are connected or that the system is production-safe. Do not accept real customer payments until every required item above is verified.
