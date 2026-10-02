-- TRUST APEX persistence extension (PostgreSQL).
create table if not exists users (
  id text primary key,
  email text not null unique,
  role text not null check (role in ('customer','merchant','admin','support','operations')),
  status text not null default 'active' check (status in ('active','pending','suspended')),
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists sessions_expiry_idx on sessions(expires_at);
