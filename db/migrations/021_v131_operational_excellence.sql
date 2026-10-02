-- TRUST V131 — operational excellence: idempotent jobs, leases, rate-limit buckets and health telemetry.
ALTER TABLE trust_jobs ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE trust_jobs ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE trust_jobs ADD COLUMN IF NOT EXISTS locked_by text;
CREATE UNIQUE INDEX IF NOT EXISTS trust_jobs_idempotency_unique ON trust_jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS trust_jobs_lease_idx ON trust_jobs(state,locked_until,run_after);

CREATE TABLE IF NOT EXISTS trust_api_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  hits integer NOT NULL DEFAULT 0 CHECK(hits >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  status text NOT NULL CHECK(status IN ('PASS','WARN','FAIL')),
  detail text,
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_health_events_observed_idx ON trust_health_events(observed_at DESC);
