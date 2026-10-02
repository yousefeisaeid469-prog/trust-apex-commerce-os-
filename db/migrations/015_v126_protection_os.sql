create table if not exists trust_protection_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  customer_id text,
  product_id text,
  seller_id text,
  check_type text not null,
  risk_score numeric(5,2) not null default 0,
  confidence numeric(5,4) not null default 0,
  action text not null,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists trust_protection_decisions (
  id uuid primary key default gen_random_uuid(),
  check_id uuid references trust_protection_checks(id),
  decision text not null,
  reviewer_id text,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_trust_protection_checks_tenant_created on trust_protection_checks(tenant_id, created_at desc);
create index if not exists idx_trust_protection_checks_risk on trust_protection_checks(risk_score desc);
