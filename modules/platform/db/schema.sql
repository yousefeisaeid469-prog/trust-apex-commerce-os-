-- TRUST V73 identity + durable commerce foundation (PostgreSQL)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('customer','merchant','admin','support','operations')),
  status text not null default 'active' check (status in ('active','pending','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists merchant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  store_name text not null,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expiry_idx on sessions(expires_at);

-- V76 merchant onboarding and tenant-safe commerce ownership.
alter table merchant_profiles add column if not exists slug text;
create unique index if not exists merchant_profiles_slug_idx on merchant_profiles(slug) where slug is not null;
