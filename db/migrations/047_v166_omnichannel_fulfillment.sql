-- TRUST V166: durable primitives for omnichannel fulfillment.
create table if not exists fulfillment_shipments (
  shipment_id text primary key,
  tenant_id text not null,
  order_id text not null,
  warehouse_id text not null,
  status text not null check (status in ('PLANNED','ALLOCATED','PICKING','SHIPPED','DELIVERED','CANCELLED')),
  eta_days integer not null check (eta_days >= 0),
  mode text not null check (mode in ('SHIP','PICKUP','DELIVERY')),
  created_at timestamptz not null default now()
);
create index if not exists fulfillment_shipments_order_idx on fulfillment_shipments(tenant_id,order_id);
create table if not exists commerce_events (
  event_id text primary key,
  tenant_id text not null,
  aggregate_id text not null,
  event_type text not null,
  aggregate_version integer not null check (aggregate_version > 0),
  idempotency_key text not null,
  occurred_at timestamptz not null,
  payload jsonb not null
);
create unique index if not exists commerce_events_idempotency_idx on commerce_events(tenant_id,idempotency_key);
