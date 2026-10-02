# TRUST V148 Release

## Global Deployment Intelligence & Multi-Region Control Plane

- Runtime identity: `V148.0.0`
- Release: `global-deployment-intelligence`
- Migration: `038_v148_global_deployment_control_plane.sql`
- Regional rollout state machine with health, capacity, dependency, blast-radius, halt, rollback, and recovery controls.
- Deterministic evidence generated from candidate and result state.
- Reference adapter is in-memory and explicitly bounded; live cloud control requires production adapters and credentials.

Verification commands:
- `npm test`
- `npm run global-deployment-audit`
- `npm run migration-check`
- `npm run release-gate`
- `npm run global-deployment`
