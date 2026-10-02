-- TRUST V168: durable primitives for supplier and procurement orchestration.
create table if not exists supply_suppliers (
  supplier_id text primary key,
  tenant_id text not null,
  name text not null,
  active boolean not null default true,
  lead_time_days integer not null check (lead_time_days >= 0),
  min_order_qty integer not null check (min_order_qty > 0),
  capacity_units bigint not null check (capacity_units >= 0),
  quality_score numeric(5,2) not null check (quality_score between 0 and 100),
  on_time_score numeric(5,2) not null check (on_time_score between 0 and 100),
  price_score numeric(5,2) not null check (price_score between 0 and 100),
  risk text not null check (risk in ('LOW','MEDIUM','HIGH','CRITICAL')),
  regions jsonb not null default '[]'::jsonb
);
create index if not exists supply_suppliers_tenant_idx on supply_suppliers(tenant_id,active,risk);
create table if not exists supply_purchase_orders (
  purchase_order_id text primary key,
  tenant_id text not null,
  supplier_id text not null,
  currency text not null,
  status text not null check (status in ('DRAFT','APPROVED','SENT')),
  subtotal_minor numeric(38,0) not null check (subtotal_minor >= 0),
  expected_arrival_days integer not null check (expected_arrival_days >= 0),
  created_at timestamptz not null default now()
);
create unique index if not exists supply_po_tenant_idempotency_idx on supply_purchase_orders(tenant_id,purchase_order_id);
