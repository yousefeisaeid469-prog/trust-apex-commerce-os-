-- V296: global commerce policy registry and durable quote evidence.
create table if not exists trust_global_country_policies (
  country_code char(2) primary key,
  default_currency char(3) not null,
  default_locale text not null,
  supported_currencies jsonb not null default '[]'::jsonb,
  payment_methods jsonb not null default '[]'::jsonb,
  shipping_modes jsonb not null default '[]'::jsonb,
  tax_registration_required boolean not null default false,
  customs_required boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists trust_global_fx_quotes (
  id uuid primary key default gen_random_uuid(),
  base_currency char(3) not null,
  quote_currency char(3) not null,
  rate numeric(28,12) not null check(rate > 0),
  provider text not null,
  as_of timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check(base_currency <> quote_currency or rate = 1)
);
create index if not exists trust_global_fx_quotes_pair_idx on trust_global_fx_quotes(base_currency,quote_currency,expires_at desc);
create table if not exists trust_global_tax_rules (
  id text primary key,
  country_code char(2) not null,
  jurisdiction text not null,
  tax_name text not null,
  rate numeric(12,8) not null check(rate >= 0 and rate <= 1),
  included_in_price boolean not null default false,
  applies_to text not null check(applies_to in ('ALL','GOODS','SHIPPING')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists trust_global_quote_evidence (
  id uuid primary key default gen_random_uuid(),
  quote_key text not null unique,
  country_code char(2) not null,
  settlement_currency char(3) not null,
  locale text not null,
  subtotal_minor bigint not null check(subtotal_minor >= 0),
  shipping_minor bigint not null check(shipping_minor >= 0),
  tax_minor bigint not null check(tax_minor >= 0),
  total_minor bigint not null check(total_minor >= 0),
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
