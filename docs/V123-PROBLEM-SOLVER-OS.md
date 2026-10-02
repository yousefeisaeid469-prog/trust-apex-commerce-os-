# TRUST V123 — Problem Solver OS

V123 adds a customer-problem resolution layer above the marketplace, payments, logistics, merchant graph and intelligence systems.

## Problems addressed
- Delivery late
- Wrong item
- Damaged item
- Missing item
- Post-purchase price drop / Price Shield
- Seller concern
- Return request
- Product fit / decision support

## Design principles
1. Solve before selling.
2. One clear next step.
3. Evidence before irreversible financial actions.
4. Human escalation when confidence is low.
5. Never fabricate live provider status.

## Architecture
- `modules/experience/problem-solver/engine.ts` — deterministic resolution engine.
- `/problem-solver` — customer experience.
- `/api/problem-solver` — decision API.
- `/problem-solver-admin` — private admin control plane.
- `db/migrations/011_v123_problem_solver.sql` — durable case/event contract.

## Production boundary
The release does not claim live carrier, payment, merchant, refund, or evidence providers are connected. Those adapters must be wired before real-world automation, especially monetary actions.
