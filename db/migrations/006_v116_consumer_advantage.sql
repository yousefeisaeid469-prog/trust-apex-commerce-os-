-- TRUST V116 — Consumer Advantage foundation
create table if not exists trust_price_watch (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  product_id uuid not null,
  target_price numeric(12,2),
  baseline_price numeric(12,2),
  currency text not null default 'EGP',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trust_promises (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  customer_id uuid,
  promise_type text not null,
  promised_value text not null,
  status text not null default 'PENDING',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists trust_loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  points integer not null,
  reason text not null,
  reference_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_trust_price_watch_customer on trust_price_watch(customer_id, status);
create index if not exists idx_trust_promises_order on trust_promises(order_id, status);
create index if not exists idx_trust_loyalty_customer on trust_loyalty_ledger(customer_id, created_at desc);
