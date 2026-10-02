-- TRUST V119: Personal Shopper operational contract
create table if not exists trust_shopper_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  query text not null,
  budget numeric(14,2),
  currency text not null default 'EGP',
  deadline text,
  priorities jsonb not null default '[]'::jsonb,
  selected_product_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_trust_shopper_customer on trust_shopper_sessions(customer_id, created_at desc);
create index if not exists idx_trust_shopper_created on trust_shopper_sessions(created_at desc);

create table if not exists trust_shopper_events (
  id bigserial primary key,
  session_id uuid references trust_shopper_sessions(id) on delete cascade,
  event_type text not null,
  product_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_trust_shopper_events_session on trust_shopper_events(session_id, created_at desc);
create index if not exists idx_trust_shopper_events_type on trust_shopper_events(event_type, created_at desc);
