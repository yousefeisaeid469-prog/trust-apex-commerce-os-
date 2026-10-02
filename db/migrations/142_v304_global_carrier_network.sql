-- TRUST V304 — Global Carrier Network Runtime
CREATE TABLE IF NOT EXISTS trust_global_carrier_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('SANDBOX','LIVE')) DEFAULT 'SANDBOX',
  enabled boolean NOT NULL DEFAULT false,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  countries jsonb NOT NULL DEFAULT '[]'::jsonb,
  currencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_global_carrier_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_code text NOT NULL REFERENCES trust_global_carrier_registry(carrier_code) ON DELETE RESTRICT,
  service_code text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('STANDARD','EXPRESS','PICKUP')),
  countries jsonb NOT NULL DEFAULT '[]'::jsonb,
  min_days integer NOT NULL CHECK (min_days >= 0),
  max_days integer NOT NULL CHECK (max_days >= min_days),
  base_price_minor bigint NOT NULL CHECK (base_price_minor >= 0),
  currency text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE(carrier_code, service_code)
);
CREATE TABLE IF NOT EXISTS trust_global_carrier_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  shipment_id uuid REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  destination_country text NOT NULL,
  requested_mode text NOT NULL CHECK (requested_mode IN ('STANDARD','EXPRESS','PICKUP')),
  selected_carrier text NOT NULL REFERENCES trust_global_carrier_registry(carrier_code) ON DELETE RESTRICT,
  selected_service text NOT NULL,
  score numeric(12,4) NOT NULL,
  route_status text NOT NULL CHECK (route_status IN ('SELECTED','REBOOKED','FAILED','COMPLETED')) DEFAULT 'SELECTED',
  reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_carrier_routes_order ON trust_global_carrier_routes(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_carrier_routes_shipment ON trust_global_carrier_routes(shipment_id, created_at DESC);
CREATE TABLE IF NOT EXISTS trust_global_carrier_health (
  carrier_code text PRIMARY KEY REFERENCES trust_global_carrier_registry(carrier_code) ON DELETE RESTRICT,
  success_count bigint NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count bigint NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  circuit_state text NOT NULL CHECK (circuit_state IN ('CLOSED','OPEN','HALF_OPEN')) DEFAULT 'CLOSED',
  last_success_at timestamptz,
  last_failure_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_global_carrier_failovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  from_carrier text NOT NULL,
  to_carrier text NOT NULL,
  reason text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_carrier_failovers_shipment ON trust_global_carrier_failovers(shipment_id, created_at DESC);

INSERT INTO trust_global_carrier_registry(carrier_code,display_name,environment,enabled,capabilities,countries,currencies)
VALUES
 ('TRUST-E2E','TRUST deterministic sandbox carrier','SANDBOX',true,'["CREATE_LABEL","TRACK","CANCEL_LABEL"]','["EG","AE","SA","US","GB","DE","FR","IN"]','["EGP","AED","SAR","USD","GBP","EUR","INR"]'),
 ('DHL','DHL adapter descriptor','LIVE',false,'["CREATE_LABEL","TRACK","CANCEL_LABEL"]','["*"]','["*"]'),
 ('FEDEX','FedEx adapter descriptor','LIVE',false,'["CREATE_LABEL","TRACK","CANCEL_LABEL"]','["*"]','["*"]'),
 ('UPS','UPS adapter descriptor','LIVE',false,'["CREATE_LABEL","TRACK","CANCEL_LABEL"]','["*"]','["*"]')
ON CONFLICT(carrier_code) DO UPDATE SET display_name=excluded.display_name,updated_at=now();
INSERT INTO trust_global_carrier_health(carrier_code) SELECT carrier_code FROM trust_global_carrier_registry ON CONFLICT(carrier_code) DO NOTHING;
