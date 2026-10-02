-- TRUST V124 — Prevention OS durability contract
create table if not exists trust_prevention_signals (
  id bigserial primary key,
  signal_type text not null,
  subject_type text,
  subject_id text,
  risk_score numeric(5,2),
  confidence numeric(5,4),
  severity text not null default 'LOW',
  source text,
  payload jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);

create table if not exists trust_prevention_interventions (
  id bigserial primary key,
  signal_id bigint references trust_prevention_signals(id),
  intervention_code text not null,
  mode text not null,
  reversible boolean not null default true,
  status text not null default 'PROPOSED',
  approved_by text,
  executed_at timestamptz,
  outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_trust_prevention_signals_subject on trust_prevention_signals(subject_type, subject_id);
create index if not exists idx_trust_prevention_signals_observed on trust_prevention_signals(observed_at desc);
