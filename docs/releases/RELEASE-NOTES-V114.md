# TRUST V114 — Agent Control Plane

V114 adds a governed multi-agent control plane over V113.

## Added
- Agent lifecycle states: RUNNING / PAUSED / KILLED
- Global kill switch
- Per-agent tool scopes and risk caps
- Per-agent rate limits and execution budgets
- Agent-to-agent message bus foundation
- Approval state API
- Authorization policy evaluator
- PostgreSQL migration for durable policies/messages/approvals
- `/agent-control` private control-plane UI
- `/api/agent-control` control API

## Safety posture
Financial, payment, refund, pricing-write, inventory-write, campaign-spend and other high-impact actions remain approval-gated. V114 does not grant unrestricted autonomous execution.

## Verification
The repository should be validated with installed dependencies using `npm run typecheck` and `npm run build` in CI/Vercel. This release does not claim a production build without that environment.
