create table if not exists trust_audit_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid null, tenant_id uuid null,
 action text not null, resource_type text not null, resource_id text null,
 request_id text null, trace_id text null, payload_json jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists trust_audit_events_created_idx on trust_audit_events(created_at desc);
create index if not exists trust_audit_events_resource_idx on trust_audit_events(resource_type,resource_id,created_at desc);
create table if not exists trust_idempotency_keys (
 id uuid primary key default gen_random_uuid(), key text not null, scope text not null,
 request_fingerprint text not null, response_json jsonb null, status_code integer null,
 expires_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(key,scope)
);
create index if not exists trust_idempotency_expiry_idx on trust_idempotency_keys(expires_at);
create table if not exists trust_webhook_inbox (
 id uuid primary key default gen_random_uuid(), provider text not null, event_id text not null,
 event_type text not null, payload_json jsonb not null, signature text null, fingerprint text not null,
 status text not null check(status in ('received','processed','failed')) default 'received',
 last_error text null, processed_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(provider,event_id)
);
create index if not exists trust_webhook_inbox_status_idx on trust_webhook_inbox(status,created_at);
