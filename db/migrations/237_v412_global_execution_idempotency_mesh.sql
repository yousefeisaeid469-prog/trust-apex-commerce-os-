-- V412: durable cross-worker execution claims, fingerprints and fencing tokens.
CREATE TABLE IF NOT EXISTS trust_execution_claims (
  scope text NOT NULL,
  operation_key text NOT NULL,
  fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCEEDED','FAILED')),
  owner_id text NOT NULL,
  fencing_token bigint NOT NULL DEFAULT 1,
  lease_expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY(scope,operation_key)
);
CREATE INDEX IF NOT EXISTS trust_execution_claims_lease_idx
  ON trust_execution_claims(status,lease_expires_at);
CREATE INDEX IF NOT EXISTS trust_execution_claims_owner_idx
  ON trust_execution_claims(owner_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_execution_claim_events (
  id bigserial PRIMARY KEY,
  scope text NOT NULL,
  operation_key text NOT NULL,
  owner_id text NOT NULL,
  fencing_token bigint NOT NULL,
  action text NOT NULL CHECK (action IN ('CLAIMED','BUSY','REPLAYED','FENCED','SUCCEEDED','FAILED','FINGERPRINT_MISMATCH')),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_execution_claim_events_key_idx
  ON trust_execution_claim_events(scope,operation_key,created_at DESC);

COMMENT ON TABLE trust_execution_claims IS
  'V412 durable execution authority shared by command, workflow, commerce and recovery workers. A fencing token invalidates stale owners.';
