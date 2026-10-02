# TRUST V108 release checklist

- [x] Payment state machine
- [x] Payment intent API boundary
- [x] HMAC webhook verification
- [x] Provider event deduplication
- [x] Order/payment state synchronization
- [x] Idempotent partial/full refunds
- [x] Server-side order ownership checks
- [x] PostgreSQL migration for payments/refunds
- [x] Outbox events for payment/refund transitions
- [ ] Configure real payment provider adapter
- [ ] Apply database migration in production
- [ ] Run `npm ci`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Configure provider webhook and secret
