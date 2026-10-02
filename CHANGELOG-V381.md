# V381.0.0 — Decision Command Gateway

- Added durable execution gateway for V380 ALLOW decisions.
- Added owner approval and durable approval audit records.
- Added idempotency keys and replay-safe command creation/execution.
- Added pre-execution revalidation of governed policy revision and active incident identity.
- Added execution/verification result persistence.
- Execution delegates only to the existing V373 bounded recovery authority.
- No direct payment, inventory, fulfillment, delivery, returns, disputes, payout or revenue mutation is introduced.
