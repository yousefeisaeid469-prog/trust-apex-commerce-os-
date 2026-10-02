-- TRUST V123: Problem Solver OS
create table if not exists trust_problem_cases (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  order_id text,
  problem_type text not null,
  severity text not null,
  status text not null default 'OPEN',
  evidence_status text not null default 'NOT_REQUESTED',
  recommended_action text,
  resolution_code text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_trust_problem_cases_status on trust_problem_cases(status, created_at desc);
create table if not exists trust_problem_events (
  id bigserial primary key,
  case_id uuid not null references trust_problem_cases(id) on delete cascade,
  event_type text not null,
  actor_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_trust_problem_events_case on trust_problem_events(case_id, created_at desc);
