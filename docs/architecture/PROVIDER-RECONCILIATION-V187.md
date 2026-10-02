# Provider Reconciliation V187

`provider -> signed webhook -> timestamp/replay verification -> durable inbox -> durable reconciliation job -> leased worker -> domain state -> outbox`

The HTTP boundary acknowledges durable receipt rather than performing provider reconciliation inline. PostgreSQL provides the idempotency constraint and `SKIP LOCKED` worker coordination. Worker failures are retried with a bounded attempt count and delay; expired Guardian execution leases are separately recovered in the same operational worker command.
