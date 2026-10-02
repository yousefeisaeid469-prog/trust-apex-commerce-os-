-- V411: worker scheduling, admission/backpressure, recovery dispatch and stale-worker takeover.
CREATE TABLE IF NOT EXISTS trust_worker_queue_policies (
  queue_name text PRIMARY KEY,
  priority integer NOT NULL DEFAULT 100 CHECK (priority >= 0),
  max_concurrency integer NOT NULL DEFAULT 4 CHECK (max_concurrency > 0),
  lease_seconds integer NOT NULL DEFAULT 90 CHECK (lease_seconds > 0),
  drain boolean NOT NULL DEFAULT false,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO trust_worker_queue_policies(queue_name,priority,max_concurrency,lease_seconds)
VALUES
 ('command',100,8,90),
 ('workflow',95,6,90),
 ('commerce-execution',90,8,90),
 ('recovery',110,4,90)
ON CONFLICT(queue_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS trust_worker_queue_slots (
  queue_name text NOT NULL REFERENCES trust_worker_queue_policies(queue_name) ON DELETE CASCADE,
  worker_id text NOT NULL REFERENCES trust_worker_instances(worker_id) ON DELETE CASCADE,
  slot_token uuid NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz NOT NULL,
  PRIMARY KEY(queue_name,worker_id)
);
CREATE INDEX IF NOT EXISTS trust_worker_queue_slots_expiry_idx
  ON trust_worker_queue_slots(queue_name,lease_expires_at);

CREATE TABLE IF NOT EXISTS trust_worker_dispatch_events (
  id bigserial PRIMARY KEY,
  queue_name text NOT NULL,
  worker_id text,
  action text NOT NULL CHECK (action IN ('ADMITTED','REJECTED_BACKPRESSURE','RELEASED','DRAINED','STALE_RECLAIMED','RECOVERY_DISPATCHED')),
  priority integer,
  active_slots integer,
  max_concurrency integer,
  reason text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_worker_dispatch_events_queue_idx
  ON trust_worker_dispatch_events(queue_name,created_at DESC);

CREATE OR REPLACE VIEW trust_worker_scheduling_snapshot AS
SELECT
  p.queue_name,
  p.priority,
  p.max_concurrency,
  p.lease_seconds,
  p.drain,
  count(s.worker_id)::int AS active_slots,
  greatest(p.max_concurrency-count(s.worker_id)::int,0) AS available_slots,
  CASE
    WHEN p.drain THEN 'DRAINING'
    WHEN count(s.worker_id)::int >= p.max_concurrency THEN 'BACKPRESSURED'
    ELSE 'READY'
  END AS scheduling_state
FROM trust_worker_queue_policies p
LEFT JOIN trust_worker_queue_slots s
  ON s.queue_name=p.queue_name AND s.lease_expires_at>now()
GROUP BY p.queue_name,p.priority,p.max_concurrency,p.lease_seconds,p.drain;

COMMENT ON VIEW trust_worker_scheduling_snapshot IS
  'V411 queue admission, priority and backpressure truth for the production worker plane.';
