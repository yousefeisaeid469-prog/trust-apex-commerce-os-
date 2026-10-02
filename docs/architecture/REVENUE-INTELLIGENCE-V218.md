# Revenue Intelligence V218

V218 adds an evidence-aware analytical layer above the V216 Revenue Engine and V217 Revenue Autopilot.

## Flow
Observed signals → contribution economics → portfolio ranking → scenario analysis → recommendation.

## Economics
For each revenue program, V218 estimates expected units, gross revenue, variable cost, fixed cost, contribution and contribution margin. Money remains integer minor units (`bigint`).

## Optimization
Scenario analysis varies a fee/rate around a baseline and applies a bounded elasticity model. Scenarios are estimates only; they do not change live pricing.

## Guardrails
- No financial/provider side effects.
- No fabricated realized revenue.
- Evidence coverage is surfaced and can lower confidence.
- Live economics require explicit business-policy approval and external evidence.
