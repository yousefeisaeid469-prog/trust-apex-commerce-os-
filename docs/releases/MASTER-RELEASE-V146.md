# TRUST APEX OS — V146 Deployment Autopilot

## Release status
Engineering release candidate: **V146.0.0**

## Included
- Deployment Autopilot state machine
- Release candidate lifecycle boundary
- Preflight + canary gate
- Automatic promotion on verified pass
- Automatic freeze on blocked canary
- Recovery verification
- Automatic rollback with post-rollback verification
- Fail-closed escalation
- Runtime state verification
- Deterministic deployment evidence
- V146 PostgreSQL migration
- Automated tests and audit script

## Verification commands
```bash
npm test
npm run deployment-autopilot-audit
npm run migration-check
npm run release-gate
npm run deployment-autopilot
```

The reference adapter is in-memory and is not evidence of live infrastructure control.
