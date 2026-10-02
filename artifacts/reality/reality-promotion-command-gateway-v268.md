# V268 Promotion Command Gateway

Status: **PROMOTION_COMMAND_GATEWAY_VERIFIED**

The promotion transition is bound to a durable command envelope, deterministic command hash, unique command id, authorization and event records. Reusing an already-applied command is idempotent; reusing the command id with a different payload is rejected. Auto-promotion remains disabled and private signing keys remain external.
