-- V414: external effect recovery + provider-side-effect closure.
-- Expired claims are recoverable without losing provider idempotency keys.
-- The provider call itself remains outside the DB transaction; the durable
-- intent ledger is the authority for replay/fencing, not a distributed 2PC.

CREATE INDEX IF NOT EXISTS trust_external_effect_expired_idx
  ON trust_external_effect_intents(lease_until,updated_at)
  WHERE status='EXECUTING';

CREATE OR REPLACE VIEW trust_external_effect_recovery_snapshot AS
SELECT
  count(*) FILTER (WHERE status='INTENDED')::bigint AS intended,
  count(*) FILTER (WHERE status='EXECUTING')::bigint AS executing,
  count(*) FILTER (WHERE status='EXECUTING' AND lease_until < now())::bigint AS expired_executing,
  count(*) FILTER (WHERE status='FAILED')::bigint AS failed,
  count(*) FILTER (WHERE status='SUCCEEDED')::bigint AS succeeded,
  count(*) FILTER (WHERE status='CANCELLED')::bigint AS cancelled,
  coalesce(max(attempts),0)::bigint AS max_attempts,
  coalesce(sum(attempts),0)::bigint AS total_attempts
FROM trust_external_effect_intents;

CREATE OR REPLACE VIEW trust_external_effect_provider_recovery AS
SELECT
  provider,
  scope,
  count(*)::bigint AS intents,
  count(*) FILTER (WHERE status='SUCCEEDED')::bigint AS succeeded,
  count(*) FILTER (WHERE status IN ('INTENDED','EXECUTING','FAILED'))::bigint AS pending,
  count(*) FILTER (WHERE status='EXECUTING' AND lease_until < now())::bigint AS expired,
  coalesce(sum(attempts),0)::bigint AS attempts
FROM trust_external_effect_intents
GROUP BY provider,scope;

COMMENT ON VIEW trust_external_effect_recovery_snapshot IS
  'V414 recovery truth for durable external effects; expired EXECUTING claims are safe to retry with the same provider idempotency key.';
