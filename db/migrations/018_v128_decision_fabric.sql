-- TRUST V128 — Evidence & Decision Fabric
create table if not exists trust_evidence_records (
  id text primary key, subject_id text not null, kind text not null, status text not null,
  source text not null, observed_at timestamptz not null, expires_at timestamptz,
  confidence numeric(5,4) not null, claim text not null, created_at timestamptz not null default now()
);
create index if not exists idx_trust_evidence_subject on trust_evidence_records(subject_id, observed_at desc);
create table if not exists trust_decision_records (
  id text primary key, subject_id text not null, action text not null, outcome text not null,
  risk text not null, confidence numeric(5,4) not null, rationale jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb, contradictions jsonb not null default '[]'::jsonb,
  reversible boolean not null default true, human_review_required boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_trust_decisions_subject on trust_decision_records(subject_id, created_at desc);
