# V380.0.0 — Global Commerce Decision Fabric

- Added durable V379 policy governance and replay-only canary lifecycle.
- Added V380 cross-domain decision requests and rule-level evidence.
- Decision outcomes are deterministic: ALLOW, REQUIRE_APPROVAL, DENY, NO_DECISION.
- Recovery ALLOW requires an active V379 governed policy and an active real incident.
- Business domains remain bounded to existing domain authorities; this layer performs no direct money, inventory, fulfillment, delivery, returns, disputes, payouts or revenue mutation.
- Added API/UI, audit and tests.
