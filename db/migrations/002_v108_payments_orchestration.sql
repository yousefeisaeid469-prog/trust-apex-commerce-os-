-- TRUST V108: payment + order orchestration
create table if not exists trust_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null, -- FK to trust_orders added in 044 (trust_orders didn't exist yet here)
  provider text not null,
  payment_intent_id text not null,
  amount numeric(12,2) not null check(amount>=0),
  currency text not null default 'EGP',
  status text not null check(status in ('pending','requires_action','authorized','captured','failed','cancelled','refunded','partially_refunded')) default 'pending',
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,payment_intent_id),
  unique(idempotency_key)
);
create index if not exists trust_payments_order_idx on trust_payments(order_id,created_at desc);
-- NOTE (V154 fix): the index below on trust_payment_events was removed from
-- here — trust_payment_events did not exist yet at this point in the
-- migration sequence (it was only ever referenced, never created, until
-- migration 044). The correct index now lives in 044_v154_missing_transactional_core.sql
-- alongside the table's own creation. Fixed pre-deployment; no live database
-- ever ran this migration set.
create table if not exists trust_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references trust_payments(id),
  amount numeric(12,2) not null check(amount>0),
  reason text,
  status text not null check(status in ('requested','processing','succeeded','failed')) default 'requested',
  provider_reference text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trust_refunds_payment_idx on trust_refunds(payment_id,created_at desc);
