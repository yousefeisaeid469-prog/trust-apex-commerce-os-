# Post-Sale Orchestration — V292

The authoritative return state machine remains the source of truth. V292 adds a durable case projection and action history around it rather than creating a competing return state machine.

Flow:
`REQUESTED → APPROVED → RECEIVED → INSPECTING → APPROVED_REFUND → REFUND_PENDING → REFUNDED → CLOSED`

Rejected returns project to `RETURN_REJECTED` and can later close.

Financial side effects remain in the V282–V287 economic/financial modules. V292 records operational visibility and notifications around those transitions.
