# TRUST V107 deployment

1. Install dependencies with `npm install` or your package manager.
2. Configure server-only `DATABASE_URL` in Vercel.
3. Configure `TRUST_SESSION_SECRET` and existing TRUST auth/admin secrets.
4. Apply migrations in order, including `modules/platform/persistence/migrations/003_v107_transaction_engine.sql`.
5. Run `npm run typecheck` and `npm run build` in CI.
6. Smoke test `/api/checkout/commit` with an authenticated test customer and an idempotency key.

Never expose DATABASE_URL to client code and never commit production secrets.
