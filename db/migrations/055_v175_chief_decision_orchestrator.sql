-- TRUST V175 — tenant-scoped chief decision arbitration and auditable outcomes.
create table if not exists trust_chief_decisions (
  tenant_id text not null,
  decision_id text not null,
  task_id text not null,
  status text not null,
  mode text not null,
  action text,
  selected_proposal_ids jsonb not null default '[]'::jsonb,
  support_bps integer not null,
  confidence_bps integer not null,
  risk_bps integer not null,
  expected_impact_bps integer not null,
  approval_required boolean not null default true,
  reason text not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, decision_id)
);
create table if not exists trust_chief_decision_audit (
  tenant_id text not null,
  decision_id text not null,
  event text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (tenant_id, decision_id, event, created_at)
);
