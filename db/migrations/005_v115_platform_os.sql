-- TRUST V115: durable platform operating-system primitives.
CREATE TABLE IF NOT EXISTS platform_events (
 id uuid PRIMARY KEY, event_name text NOT NULL, tenant_id text NOT NULL, aggregate_id text NOT NULL,
 correlation_id text NOT NULL, causation_id text, payload jsonb NOT NULL, occurred_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_events_name_time ON platform_events(event_name, occurred_at DESC);
CREATE TABLE IF NOT EXISTS platform_jobs (
 id uuid PRIMARY KEY, job_type text NOT NULL, state text NOT NULL, payload jsonb NOT NULL,
 attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 5, run_after timestamptz NOT NULL,
 last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_jobs_ready ON platform_jobs(state, run_after);
CREATE TABLE IF NOT EXISTS workflow_instances (
 id uuid PRIMARY KEY, definition_id text NOT NULL, definition_version integer NOT NULL DEFAULT 1,
 state text NOT NULL, current_step text, correlation_id text NOT NULL, context jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_notifications (
 id uuid PRIMARY KEY, recipient_id text NOT NULL, channel text NOT NULL, topic text NOT NULL,
 title text NOT NULL, body text NOT NULL, dedupe_key text NOT NULL UNIQUE, status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_feature_flags (
 flag_key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false, rollout integer NOT NULL DEFAULT 100,
 metadata jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_event_subscriptions (
 id uuid PRIMARY KEY, event_name text NOT NULL, consumer_name text NOT NULL, active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_name, consumer_name)
);
