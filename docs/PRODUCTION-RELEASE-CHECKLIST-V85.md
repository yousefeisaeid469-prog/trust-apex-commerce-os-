# TRUST V85 — Production Release Checklist

## Release status
V85 is a Release Candidate. It is not declared production-ready until external infrastructure checks below pass.

## Required infrastructure
- [ ] PostgreSQL production database provisioned
- [ ] `DATABASE_URL` configured server-side
- [ ] `TRUST_SESSION_SECRET` generated with high entropy
- [ ] `TRUST_WEBHOOK_SECRET` configured from the payment provider
- [ ] Payment provider account configured
- [ ] Webhook endpoint configured and signature verification tested
- [ ] Email/SMS provider configured if notifications are enabled
- [ ] Object storage configured if product media is externalized

## Application checks
- [ ] `npm ci` succeeds in CI
- [ ] `npm run audit` succeeds
- [ ] `npm run prebuild` succeeds
- [ ] `npm run build` succeeds
- [ ] Staging smoke tests pass
- [ ] Database migrations applied successfully
- [ ] Checkout concurrency test passes
- [ ] Duplicate webhook test passes
- [ ] Refund/reversal test passes
- [ ] Authentication/session revocation test passes

## Security
- [ ] No secrets committed
- [ ] Production environment variables are server-only
- [ ] Rate limiting uses a shared durable store in multi-instance deployment
- [ ] Payment webhooks require provider signatures
- [ ] Audit logs are retained according to policy
- [ ] Backups and restore procedure tested

## Operational readiness
- [ ] Error monitoring enabled
- [ ] Uptime/health monitoring enabled
- [ ] Database monitoring enabled
- [ ] Alert routing tested
- [ ] Rollback procedure tested
- [ ] Incident owner and escalation path defined
