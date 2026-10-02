-- V410: canonical worker ownership, leases, heartbeats, and run accounting.
CREATE TABLE IF NOT EXISTS trust_worker_instances (
  worker_id text PRIMARY KEY,
  worker_type text NOT NULL,
  status text NOT NULL DEFAULT 'STARTING' CHECK (status IN ('STARTING','RUNNING','DRAINING','STOPPED','FAILED','STALE')),
  hostname text,
  pid integer,
  lease_token uuid NOT NULL,
  lease_expires_at timestamptz NOT NULL,
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz,
  last_error text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trust_worker_instances_lease_idx
  ON trust_worker_instances(status, lease_expires_at);

CREATE TABLE IF NOT EXISTS trust_worker_runs (
  id bigserial PRIMARY KEY,
  worker_id text NOT NULL REFERENCES trust_worker_instances(worker_id) ON DELETE CASCADE,
  worker_type text NOT NULL,
  trigger text NOT NULL DEFAULT 'manual',
  status text NOT NULL CHECK (status IN ('RUNNING','SUCCEEDED','FAILED','DRAINED')),
  claimed_count integer NOT NULL DEFAULT 0,
  succeeded_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  recovered_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  last_heartbeat_at timestamptz,
  error_code text,
  error_message text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS trust_worker_runs_worker_started_idx
  ON trust_worker_runs(worker_id, started_at DESC);
CREATE INDEX IF NOT EXISTS trust_worker_runs_status_idx
  ON trust_worker_runs(status, started_at DESC);

CREATE OR REPLACE VIEW trust_production_worker_snapshot AS
SELECT
  i.worker_id,
  i.worker_type,
  CASE
    WHEN i.status IN ('RUNNING','DRAINING') AND i.lease_expires_at > now() AND i.heartbeat_at > now() - interval '90 seconds' THEN 'HEALTHY'
    WHEN i.lease_expires_at <= now() OR i.heartbeat_at <= now() - interval '90 seconds' THEN 'STALE'
    ELSE i.status
  END AS health,
  i.status,
  i.hostname,
  i.pid,
  i.lease_expires_at,
  i.heartbeat_at,
  i.started_at,
  i.stopped_at,
  i.last_error,
  coalesce(r.run_count,0)::int AS run_count,
  coalesce(r.last_run_status,'NONE') AS last_run_status,
  r.last_run_at
FROM trust_worker_instances i
LEFT JOIN LATERAL (
  SELECT count(*)::int AS run_count,
         (array_agg(w.status ORDER BY w.started_at DESC))[1] AS last_run_status,
         max(w.started_at) AS last_run_at
  FROM trust_worker_runs w
  WHERE w.worker_id=i.worker_id
) r ON true;
