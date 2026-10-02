-- TRUST V83: persistent transactional commerce extension for PostgreSQL.
-- Run after sql-schema-v81.sql. Keep all application secrets outside the database.
create table if not exists trust_idempotency_keys (
  key_hash text not null,
  scope text not null,
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key(key_hash, scope)
);
create index if not exists trust_idempotency_expiry_idx on trust_idempotency_keys(expires_at);

create table if not exists trust_inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references trust_orders(id) on delete cascade,
  product_id uuid not null references trust_products(id),
  quantity integer not null check(quantity > 0),
  status text not null check(status in ('reserved','released','consumed')) default 'reserved',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists trust_inventory_reservation_order_idx on trust_inventory_reservations(order_id,status);

create table if not exists trust_order_addresses (
  order_id uuid primary key references trust_orders(id) on delete cascade,
  full_name text not null,
  phone text not null,
  governorate text not null,
  city text not null,
  street text not null,
  building text,
  apartment text
);

create table if not exists trust_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  payment_intent_id text not null,
  status text not null,
  payload_json jsonb not null,
  received_at timestamptz not null default now(),
  unique(provider,provider_event_id)
);

create table if not exists trust_outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_id text not null,
  payload_json jsonb not null,
  status text not null check(status in ('pending','processing','published','failed')) default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists trust_outbox_pending_idx on trust_outbox_events(status,available_at);

create table if not exists trust_audit_chain (
  id bigserial primary key,
  event_type text not null,
  actor_id text,
  aggregate_id text,
  payload_hash text not null,
  previous_hash text,
  chain_hash text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists trust_audit_aggregate_idx on trust_audit_chain(aggregate_id,created_at desc);
