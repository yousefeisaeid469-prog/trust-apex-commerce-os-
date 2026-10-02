# TRUST V108 deployment

1. Apply `db/migrations/004_v108_payments_orchestration.sql` after the existing TRUST schema migrations.
2. Set `DATABASE_URL` as a server-only Vercel environment variable.
3. Set `TRUST_PAYMENT_WEBHOOK_SECRET` as a server-only Vercel environment variable.
4. Configure a real payment-provider adapter and map provider events to the V108 status vocabulary.
5. Configure the provider webhook endpoint to `/api/payments/webhook` and send the raw body with `x-trust-signature` according to the configured HMAC contract.
6. Run `npm ci`, then `npm run typecheck`, `npm run build`, and the release scripts in CI.
