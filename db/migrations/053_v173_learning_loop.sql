-- TRUST V173 — prediction/outcome calibration persistence.
create table if not exists trust_prediction_outcomes (
  tenant_id text not null,
  prediction_id text not null,
  decision_id text not null,
  metric text not null,
  predicted numeric not null,
  observed numeric,
  confidence_bps integer not null,
  status text not null default 'MISSING',
  created_at timestamptz not null default now(),
  observed_at timestamptz,
  primary key (tenant_id, prediction_id)
);
create index if not exists idx_trust_prediction_outcomes_tenant_metric on trust_prediction_outcomes(tenant_id, metric, created_at desc);
