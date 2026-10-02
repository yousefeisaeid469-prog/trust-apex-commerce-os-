-- V392: durable configuration for bounded retry and load-resilience observability.
-- This migration is additive and does not alter existing commerce data.
create table if not exists trust_resilience_policies (
  policy_key text primary key,
  max_attempts integer not null check (max_attempts between 1 and 5),
  base_backoff_ms integer not null check (base_backoff_ms >= 0),
  max_backoff_ms integer not null check (max_backoff_ms >= base_backoff_ms),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into trust_resilience_policies(policy_key,max_attempts,base_backoff_ms,max_backoff_ms)
values ('commerce-default',3,100,5000)
on conflict(policy_key) do nothing;
