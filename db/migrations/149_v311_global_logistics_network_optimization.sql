-- TRUST V311 — Global Logistics Network Optimization
CREATE TABLE IF NOT EXISTS trust_global_logistics_network_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), idempotency_key text NOT NULL UNIQUE,
 objective text NOT NULL CHECK(objective IN ('BALANCED','COST','SPEED','RELIABILITY','PROMISE')),
 shipment_count integer NOT NULL CHECK(shipment_count>=0), allocated_count integer NOT NULL CHECK(allocated_count>=0),
 unallocated_count integer NOT NULL CHECK(unallocated_count>=0), carriers_used integer NOT NULL CHECK(carriers_used>=0),
 total_cost_minor numeric(30,0) NOT NULL CHECK(total_cost_minor>=0), average_max_days numeric(10,2),
 plan_json jsonb NOT NULL, status text NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED','APPLIED','SUPERSEDED','CANCELLED')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_global_logistics_network_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES trust_global_logistics_network_plans(id) ON DELETE CASCADE,
 shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT, carrier_code text NOT NULL, service_code text NOT NULL,
 score numeric(14,6) NOT NULL, cost_minor numeric(30,0) NOT NULL CHECK(cost_minor>=0), max_days integer NOT NULL CHECK(max_days>=0),
 reliability numeric(8,6) NOT NULL CHECK(reliability>=0 AND reliability<=1), reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(plan_id,shipment_id)
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_network_plans_created ON trust_global_logistics_network_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_network_allocations_plan ON trust_global_logistics_network_allocations(plan_id);
CREATE INDEX IF NOT EXISTS idx_global_logistics_network_allocations_shipment ON trust_global_logistics_network_allocations(shipment_id,created_at DESC);
