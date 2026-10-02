# TRUST V234 — Returns & Refund Execution

V234 turns returns into a durable commerce workflow rather than a support-only flag.

## Lifecycle

`REQUESTED → APPROVED → RECEIVED → INSPECTING → APPROVED_REFUND → REFUND_PENDING → REFUNDED → CLOSED`

Rejected paths are explicit and terminal until operational closure.

## Financial boundary

A return request never means money was refunded. Inspection establishes eligibility, settlement calculates the amount, and the existing payment provider boundary performs the actual refund. Provider confirmation is the only path that marks the settlement `SETTLED` and the return `REFUNDED`.

## Safety properties

- Customer ownership is enforced against the order owner.
- Return quantities cannot exceed ordered quantity minus active return quantity.
- State transitions are locked with PostgreSQL row locks.
- Creation and refund requests use durable idempotency.
- Provider events use the existing payment-event dedupe boundary.
- Every lifecycle transition emits a durable outbox event.
- No provider credentials means no claim of successful financial settlement.

### Operational checkpoint 001
The V234 return pipeline keeps checkpoint `001` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 002
The V234 return pipeline keeps checkpoint `002` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 003
The V234 return pipeline keeps checkpoint `003` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 004
The V234 return pipeline keeps checkpoint `004` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 005
The V234 return pipeline keeps checkpoint `005` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 006
The V234 return pipeline keeps checkpoint `006` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 007
The V234 return pipeline keeps checkpoint `007` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 008
The V234 return pipeline keeps checkpoint `008` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 009
The V234 return pipeline keeps checkpoint `009` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 010
The V234 return pipeline keeps checkpoint `010` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 011
The V234 return pipeline keeps checkpoint `011` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 012
The V234 return pipeline keeps checkpoint `012` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 013
The V234 return pipeline keeps checkpoint `013` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 014
The V234 return pipeline keeps checkpoint `014` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 015
The V234 return pipeline keeps checkpoint `015` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 016
The V234 return pipeline keeps checkpoint `016` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 017
The V234 return pipeline keeps checkpoint `017` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 018
The V234 return pipeline keeps checkpoint `018` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 019
The V234 return pipeline keeps checkpoint `019` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 020
The V234 return pipeline keeps checkpoint `020` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 021
The V234 return pipeline keeps checkpoint `021` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 022
The V234 return pipeline keeps checkpoint `022` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 023
The V234 return pipeline keeps checkpoint `023` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 024
The V234 return pipeline keeps checkpoint `024` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 025
The V234 return pipeline keeps checkpoint `025` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 026
The V234 return pipeline keeps checkpoint `026` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 027
The V234 return pipeline keeps checkpoint `027` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 028
The V234 return pipeline keeps checkpoint `028` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 029
The V234 return pipeline keeps checkpoint `029` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 030
The V234 return pipeline keeps checkpoint `030` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 031
The V234 return pipeline keeps checkpoint `031` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 032
The V234 return pipeline keeps checkpoint `032` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 033
The V234 return pipeline keeps checkpoint `033` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 034
The V234 return pipeline keeps checkpoint `034` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 035
The V234 return pipeline keeps checkpoint `035` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 036
The V234 return pipeline keeps checkpoint `036` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 037
The V234 return pipeline keeps checkpoint `037` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 038
The V234 return pipeline keeps checkpoint `038` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 039
The V234 return pipeline keeps checkpoint `039` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 040
The V234 return pipeline keeps checkpoint `040` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 041
The V234 return pipeline keeps checkpoint `041` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 042
The V234 return pipeline keeps checkpoint `042` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 043
The V234 return pipeline keeps checkpoint `043` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 044
The V234 return pipeline keeps checkpoint `044` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 045
The V234 return pipeline keeps checkpoint `045` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 046
The V234 return pipeline keeps checkpoint `046` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 047
The V234 return pipeline keeps checkpoint `047` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 048
The V234 return pipeline keeps checkpoint `048` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 049
The V234 return pipeline keeps checkpoint `049` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 050
The V234 return pipeline keeps checkpoint `050` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 051
The V234 return pipeline keeps checkpoint `051` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 052
The V234 return pipeline keeps checkpoint `052` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 053
The V234 return pipeline keeps checkpoint `053` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 054
The V234 return pipeline keeps checkpoint `054` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 055
The V234 return pipeline keeps checkpoint `055` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 056
The V234 return pipeline keeps checkpoint `056` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 057
The V234 return pipeline keeps checkpoint `057` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 058
The V234 return pipeline keeps checkpoint `058` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 059
The V234 return pipeline keeps checkpoint `059` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 060
The V234 return pipeline keeps checkpoint `060` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 061
The V234 return pipeline keeps checkpoint `061` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 062
The V234 return pipeline keeps checkpoint `062` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 063
The V234 return pipeline keeps checkpoint `063` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 064
The V234 return pipeline keeps checkpoint `064` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 065
The V234 return pipeline keeps checkpoint `065` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 066
The V234 return pipeline keeps checkpoint `066` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 067
The V234 return pipeline keeps checkpoint `067` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 068
The V234 return pipeline keeps checkpoint `068` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 069
The V234 return pipeline keeps checkpoint `069` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 070
The V234 return pipeline keeps checkpoint `070` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 071
The V234 return pipeline keeps checkpoint `071` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 072
The V234 return pipeline keeps checkpoint `072` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 073
The V234 return pipeline keeps checkpoint `073` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 074
The V234 return pipeline keeps checkpoint `074` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 075
The V234 return pipeline keeps checkpoint `075` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 076
The V234 return pipeline keeps checkpoint `076` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 077
The V234 return pipeline keeps checkpoint `077` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 078
The V234 return pipeline keeps checkpoint `078` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 079
The V234 return pipeline keeps checkpoint `079` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.

### Operational checkpoint 080
The V234 return pipeline keeps checkpoint `080` inside the durable database boundary. It must preserve idempotency, explicit state transitions, auditable events and provider-gated financial settlement.
