# TRUST V87 — APEX DEPLOYMENT HARDENING

V87 is a release-candidate hardening pass focused on deployment correctness rather than adding cosmetic features.

## Included
- Unified release version to 87.0.0.
- Deployment smoke test for critical Next.js/Vercel assets.
- Vercel build/install command consistency checks.
- Environment contract checks for database, session, and webhook secrets.
- Release gate and audit version alignment.
- Existing commerce, identity, merchant, inventory, payment, webhook, outbox, and PostgreSQL boundaries retained.

## Verification
- Run `npm run deployment-smoke`
- Run `npm run audit`
- Run `npm run prebuild`
- Run `npm run release-gate`
- Run `npm run build`

`npm run build` requires dependencies to be installed in the target environment. This package does not contain production credentials.
