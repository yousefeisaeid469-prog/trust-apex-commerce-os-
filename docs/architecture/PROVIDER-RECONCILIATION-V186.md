# Provider Reconciliation — V186

V186 introduces a provider-side webhook inbox and reconciliation boundary for Purchase Guardian and production commerce adapters.

## Flow

`provider -> signed webhook -> durable inbox -> idempotent reconciliation -> domain state -> transactional outbox`

The webhook endpoint verifies HMAC-SHA256 before parsing business state. PostgreSQL uniqueness on `(provider,event_id)` makes provider retries safe. Reconciliation is repeatable and records the provider reference against the Guardian action when the payload carries an action identity.

Expired Guardian execution leases can be recovered with `recoverExpiredGuardianActions`, using `FOR UPDATE SKIP LOCKED` so multiple workers can safely compete for recovery work.

## Production boundary
The code provides the application boundary and deterministic semantics. Live provider certification, secret rotation, timestamp/replay-window validation, rate limiting, WAF/TLS, monitoring, and provider-specific payload validation remain deployment responsibilities.
