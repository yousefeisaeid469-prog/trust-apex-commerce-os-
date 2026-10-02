# TRUST V119 — Personal Shopper

TRUST V119 moves discovery from search/recommendation into a customer-controlled shopping plan.

## Added
- Personal Shopper engine: mission → ranked products → trade-offs → bundle → compare → next steps.
- Budget-fit classification: great / good / stretch.
- Explainable ranking reasons and explicit guardrails.
- Customer-facing `/personal-shopper` experience.
- Private `/personal-shopper/admin` control surface protected by the existing admin session.
- `/api/personal-shopper` mission endpoint.
- Durable SQL contract for shopper sessions and events.
- Main shell navigation entry.

## Safety / truthfulness
- No live price, stock or delivery claims until source validation at checkout.
- Sponsored ranking requires disclosure.
- No fabricated AI confidence or visual-search claims.
- Analytics are designed around consent and retention controls.

## Validation
- Release audit
- Release gate
- Deployment smoke
- Contract check
- Parity check
- TypeScript/TSX syntax transpilation
- ZIP integrity

`next build` is not claimed unless dependencies are installed and the build actually runs.
