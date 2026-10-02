-- V294: durable evidence for real production-like end-to-end runs.
create table if not exists trust_production_e2e_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  environment text not null check (environment in ('SANDBOX','STAGING','LIVE')),
  app_base_url text not null,
  provider text not null,
  status text not null default 'RUNNING' check (status in ('RUNNING','PASSED','FAILED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists trust_production_e2e_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references trust_production_e2e_runs(id) on delete cascade,
  step_key text not null,
  status text not null check (status in ('STARTED','PASSED','FAILED','SKIPPED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  evidence_json jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  unique(run_id, step_key)
);

create index if not exists trust_production_e2e_steps_run_idx on trust_production_e2e_steps(run_id, started_at);
