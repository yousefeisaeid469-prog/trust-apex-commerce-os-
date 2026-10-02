# TRUST APEX OS — V381.0.0

## Decision Command Gateway

V381 turns an executable V380 ALLOW decision into a durable, owner-approved command without making the decision layer a new business authority.

Flow:

Decision ALLOW → durable command → owner approval → policy/incident revalidation → existing authority execution → verification → durable result.

The only executable command registered in V381 is `RECOVER_ORDER_LEASES`, delegated to the existing V373 verified recovery authority.

No direct money, inventory, fulfillment, delivery, returns, disputes, payout or revenue mutation is performed by V381.
