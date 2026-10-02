create table if not exists trust_customer_segments (
 id uuid primary key,
 name text not null unique,
 priority integer not null default 1 check(priority between 1 and 1000),
 enabled boolean not null default true,
 rules jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists trust_customer_segment_members (
 segment_id uuid not null references trust_customer_segments(id) on delete cascade,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 score integer not null check(score between 0 and 100),
 metrics jsonb not null default '{}'::jsonb,
 evaluated_at timestamptz not null default now(),
 primary key(segment_id,customer_id)
);
create index if not exists trust_customer_segment_members_customer_idx on trust_customer_segment_members(customer_id,score desc);
create index if not exists trust_customer_segment_members_stale_idx on trust_customer_segment_members(evaluated_at);
create table if not exists trust_customer_events (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 name text not null,
 entity_type text,
 entity_id text,
 properties jsonb not null default '{}'::jsonb,
 fingerprint text not null unique,
 idempotency_key text,
 occurred_at timestamptz not null default now()
);
create index if not exists trust_customer_events_customer_idx on trust_customer_events(customer_id,occurred_at desc);
create index if not exists trust_customer_events_name_idx on trust_customer_events(name,occurred_at desc);
create table if not exists trust_customer_journeys (
 id uuid primary key,
 name text not null unique,
 status text not null check(status in ('DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED')),
 trigger text not null,
 definition jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists trust_customer_journey_runs (
 id uuid primary key,
 journey_id uuid not null references trust_customer_journeys(id) on delete cascade,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 status text not null check(status in ('QUEUED','RUNNING','COMPLETED','FAILED','CANCELLED')),
 current_position integer not null default 1,
 context jsonb not null default '{}'::jsonb,
 started_at timestamptz,
 completed_at timestamptz,
 updated_at timestamptz not null default now()
);
create unique index if not exists trust_customer_journey_active_uq on trust_customer_journey_runs(journey_id,customer_id) where status in ('QUEUED','RUNNING');
create table if not exists trust_customer_journey_steps (
 id uuid primary key,
 run_id uuid not null references trust_customer_journey_runs(id) on delete cascade,
 position integer not null,
 kind text not null,
 status text not null,
 payload jsonb not null default '{}'::jsonb,
 executed_at timestamptz not null default now(),
 unique(run_id,position)
);
create index if not exists trust_customer_journey_runs_queue_idx on trust_customer_journey_runs(status,updated_at);
