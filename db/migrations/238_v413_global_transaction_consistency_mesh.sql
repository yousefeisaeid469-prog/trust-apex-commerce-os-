-- V413: transactional outbox consistency + durable external effect intents.
-- Guarantees a DB transaction can atomically create its event/effect intent,
-- while external effects remain retryable and idempotent after process crashes.

ALTER TABLE trust_outbox_events
  ADD COLUMN IF NOT EXISTS event_key text;

CREATE UNIQUE INDEX IF NOT EXISTS trust_outbox_events_event_key_uq
  ON trust_outbox_events(tenant_id,event_type,aggregate_id,event_key)
  WHERE event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS trust_outbox_events_correlation_idx
  ON trust_outbox_events(correlation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_external_effect_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  effect_key text NOT NULL,
  fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'INTENDED'
    CHECK (status IN ('INTENDED','EXECUTING','SUCCEEDED','FAILED','CANCELLED')),
  owner_id text,
  fencing_token bigint,
  provider text,
  provider_reference text,
  request_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_json jsonb,
  last_error text,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(scope,effect_key)
);
CREATE INDEX IF NOT EXISTS trust_external_effect_ready_idx
  ON trust_external_effect_intents(status,available_at,created_at)
  WHERE status IN ('INTENDED','EXECUTING','FAILED');
CREATE INDEX IF NOT EXISTS trust_external_effect_provider_idx
  ON trust_external_effect_intents(provider,provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_external_effect_events (
  id bigserial PRIMARY KEY,
  intent_id uuid NOT NULL REFERENCES trust_external_effect_intents(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('INTENDED','CLAIMED','REPLAYED','SUCCEEDED','FAILED','FENCED','CANCELLED')),
  owner_id text,
  fencing_token bigint,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_external_effect_events_intent_idx
  ON trust_external_effect_events(intent_id,created_at DESC);

CREATE OR REPLACE VIEW trust_transaction_consistency_snapshot AS
SELECT
  (SELECT count(*) FROM trust_outbox_events WHERE status IN ('pending','processing','failed'))::bigint AS pending_outbox,
  (SELECT count(*) FROM trust_external_effect_intents WHERE status IN ('INTENDED','EXECUTING','FAILED'))::bigint AS pending_external_effects,
  (SELECT count(*) FROM trust_external_effect_intents WHERE status='SUCCEEDED')::bigint AS succeeded_external_effects,
  (SELECT count(*) FROM trust_external_effect_intents WHERE status='FAILED')::bigint AS failed_external_effects;

COMMENT ON TABLE trust_external_effect_intents IS
  'V413 durable intent ledger for external side effects. The DB transaction creates the intent before the external call; provider idempotency makes retries safe.';
COMMENT ON TABLE trust_external_effect_events IS
  'V413 append-only audit trail for external effect claim, replay, completion and fencing.';
