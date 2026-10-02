-- V295: durable evidence for adversarial production-hardening campaigns.
create table if not exists trust_production_hardening_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  environment text not null check (environment in ('LOCAL','SANDBOX','STAGING','LIVE')),
  status text not null check (status in ('RUNNING','PASSED','FAILED')),
  scope_json jsonb not null default '{}'::jsonb,
  summary_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists trust_production_hardening_checks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references trust_production_hardening_runs(id) on delete cascade,
  check_key text not null,
  status text not null check (status in ('PASS','FAIL','SKIPPED')),
  expected text not null,
  actual text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_id,check_key)
);
create index if not exists trust_production_hardening_checks_run_idx on trust_production_hardening_checks(run_id,created_at);
