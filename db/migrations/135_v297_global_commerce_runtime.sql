-- V297: operational global-commerce registry and adapter capability layer.
create table if not exists trust_global_currencies (
  code char(3) primary key,
  minor_unit smallint not null check(minor_unit between 0 and 4),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists trust_global_payment_adapters (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  capability text not null,
  country_code char(2) not null,
  settlement_currency char(3) not null,
  environment text not null check(environment in ('SANDBOX','PRODUCTION')),
  active boolean not null default true,
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(provider,capability,country_code,settlement_currency,environment)
);
create table if not exists trust_global_shipping_zones (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  mode text not null check(mode in ('STANDARD','EXPRESS','PICKUP')),
  currency char(3) not null,
  price_minor bigint not null check(price_minor >= 0),
  eta_min_days smallint not null check(eta_min_days >= 0),
  eta_max_days smallint not null check(eta_max_days >= eta_min_days),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(country_code,mode,currency)
);
create table if not exists trust_global_locales (
  country_code char(2) not null,
  locale text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(country_code,locale)
);
create index if not exists trust_global_payment_adapters_lookup on trust_global_payment_adapters(country_code,settlement_currency,capability,active);
create index if not exists trust_global_shipping_lookup on trust_global_shipping_zones(country_code,currency,mode,active);
