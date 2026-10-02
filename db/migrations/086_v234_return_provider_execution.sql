-- V234 provider boundary for return labels and webhook processing.
CREATE TABLE IF NOT EXISTS trust_return_provider_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, event_id text NOT NULL,
 return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE, event_type text NOT NULL,
 occurred_at timestamptz NOT NULL, payload_json jsonb NOT NULL, status text NOT NULL DEFAULT 'PENDING'
 CHECK(status IN ('PENDING','PROCESSING','PROCESSED','FAILED')), processing_attempts integer NOT NULL DEFAULT 0,
 last_error text, processed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_return_provider_events_status ON trust_return_provider_events(status,created_at);
CREATE INDEX IF NOT EXISTS idx_trust_return_provider_events_return ON trust_return_provider_events(return_id,occurred_at DESC);
CREATE TABLE IF NOT EXISTS trust_return_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, event_id text NOT NULL,
 return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'PENDING'
 CHECK(status IN ('PENDING','PROCESSING','DONE','FAILED')), attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, last_error text, processed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_return_jobs_ready ON trust_return_jobs(status,available_at,lease_until);
