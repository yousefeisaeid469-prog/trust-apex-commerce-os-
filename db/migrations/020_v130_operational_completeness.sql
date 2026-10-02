-- TRUST V130 — operational completeness: durable jobs, auth throttling, provider event uniqueness.
CREATE TABLE IF NOT EXISTS trust_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK(length(type) BETWEEN 1 AND 200),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'QUEUED' CHECK(state IN ('QUEUED','RUNNING','SUCCEEDED','RETRYING','FAILED','DEAD')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK(max_attempts BETWEEN 1 AND 50),
  run_after timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_jobs_claim_idx ON trust_jobs(state,run_after,created_at);

CREATE TABLE IF NOT EXISTS trust_auth_rate_limits (
  bucket_key text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NOTE (V154 fix): the unique index below on trust_payment_events was
-- removed from here — that table did not exist yet at this point in the
-- migration sequence (only created in 044_v154_missing_transactional_core.sql,
-- which already declares provider+provider_event_id UNIQUE on the table
-- itself, making this redundant anyway). Fixed pre-deployment.
CREATE INDEX IF NOT EXISTS trust_sessions_cleanup_idx ON trust_sessions(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS trust_outbox_claim_idx ON trust_outbox_events(status,available_at,created_at);
