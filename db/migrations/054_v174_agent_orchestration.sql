-- TRUST V174 — tenant-scoped agent orchestration registry and execution receipts.
create table if not exists trust_agent_registry (
  tenant_id text not null,
  agent_id text not null,
  role text not null,
  status text not null default 'ACTIVE',
  capabilities jsonb not null default '[]'::jsonb,
  max_risk_bps integer not null,
  min_confidence_bps integer not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, agent_id)
);
create table if not exists trust_agent_execution_receipts (
  tenant_id text not null,
  plan_id text not null,
  status text not null,
  proposal_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (tenant_id, plan_id)
);
