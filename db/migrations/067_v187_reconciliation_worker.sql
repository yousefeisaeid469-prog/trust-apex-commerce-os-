-- V187 — queued provider reconciliation, replay-window protection and durable worker leases.
CREATE TABLE IF NOT EXISTS trust_provider_reconciliation_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL,
 event_id text NOT NULL,
 status text NOT NULL CHECK(status IN ('PENDING','PROCESSING','DONE','FAILED')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 available_at timestamptz NOT NULL DEFAULT now(),
 lease_until timestamptz,
 last_error text,
 processed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_provider_reconciliation_jobs_claim ON trust_provider_reconciliation_jobs(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS idx_provider_reconciliation_jobs_event ON trust_provider_reconciliation_jobs(provider,event_id);
