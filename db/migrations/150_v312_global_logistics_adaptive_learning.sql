-- TRUST V312 — Global Logistics Adaptive Learning
-- Learns carrier/service performance from reconciled shipment outcomes and stores auditable profiles.
CREATE TABLE IF NOT EXISTS trust_global_logistics_learning_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL','COUNTRY','ROUTE')),
  sample_count integer NOT NULL CHECK (sample_count >= 0),
  profile_count integer NOT NULL CHECK (profile_count >= 0),
  model_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('COMPLETED','NO_DATA','FAILED')),
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_global_logistics_learning_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES trust_global_logistics_learning_runs(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  carrier_code text NOT NULL,
  service_code text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('DELIVERED','EXCEPTION','CANCELLED')),
  promise_hit boolean,
  transit_days numeric(12,4),
  planned_max_days integer,
  cost_minor numeric(30,0),
  occurred_at timestamptz NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_id, shipment_id)
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_learning_obs_profile ON trust_global_logistics_learning_observations(carrier_code,service_code,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_learning_obs_shipment ON trust_global_logistics_learning_observations(shipment_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_global_logistics_carrier_learning (
  carrier_code text NOT NULL,
  service_code text NOT NULL,
  sample_count integer NOT NULL CHECK (sample_count >= 0),
  delivered_count integer NOT NULL CHECK (delivered_count >= 0),
  exception_count integer NOT NULL CHECK (exception_count >= 0),
  cancelled_count integer NOT NULL CHECK (cancelled_count >= 0),
  delivery_rate numeric(8,6) NOT NULL CHECK (delivery_rate >= 0 AND delivery_rate <= 1),
  promise_hit_rate numeric(8,6) NOT NULL CHECK (promise_hit_rate >= 0 AND promise_hit_rate <= 1),
  exception_rate numeric(8,6) NOT NULL CHECK (exception_rate >= 0 AND exception_rate <= 1),
  avg_transit_days numeric(12,4),
  confidence numeric(8,6) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  adaptive_reliability numeric(8,6) NOT NULL CHECK (adaptive_reliability >= 0 AND adaptive_reliability <= 1),
  model_version text NOT NULL,
  last_observed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (carrier_code,service_code)
);
