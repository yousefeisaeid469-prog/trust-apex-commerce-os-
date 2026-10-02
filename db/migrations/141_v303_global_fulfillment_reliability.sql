-- TRUST V303 — Global Fulfillment Reliability + Exception Recovery
CREATE TABLE IF NOT EXISTS trust_global_fulfillment_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  orchestration_id uuid REFERENCES trust_global_order_orchestrations(id) ON DELETE RESTRICT,
  fulfillment_order_id uuid REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE RESTRICT,
  shipment_id uuid REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  exception_code text NOT NULL CHECK (exception_code IN ('ADDRESS_ISSUE','CUSTOMS_HOLD','DAMAGED','RECIPIENT_UNAVAILABLE','WEATHER_DELAY','CARRIER_DELAY','UNKNOWN')),
  status text NOT NULL CHECK (status IN ('OPEN','INVESTIGATING','ACTION_REQUIRED','RECOVERING','RESOLVED','ESCALATED')) DEFAULT 'OPEN',
  severity text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(shipment_id, exception_code, status) DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS idx_global_fulfillment_exceptions_order ON trust_global_fulfillment_exceptions(order_id, status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_fulfillment_exceptions_shipment ON trust_global_fulfillment_exceptions(shipment_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS trust_global_fulfillment_recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_id uuid NOT NULL REFERENCES trust_global_fulfillment_exceptions(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  shipment_id uuid REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  action_type text NOT NULL CHECK (action_type IN ('RETRY_TRACKING','REISSUE_LABEL','REROUTE','CUSTOMS_REVIEW','ADDRESS_REVIEW','CARRIER_ESCALATION','CUSTOMER_CONTACT','CANCEL_FULFILLMENT','MARK_RESOLVED')),
  status text NOT NULL CHECK (status IN ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')) DEFAULT 'PENDING',
  idempotency_key text NOT NULL UNIQUE,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 20),
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_fulfillment_recovery_exception ON trust_global_fulfillment_recovery_actions(exception_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_fulfillment_recovery_order ON trust_global_fulfillment_recovery_actions(order_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_global_fulfillment_sla_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  orchestration_id uuid REFERENCES trust_global_order_orchestrations(id) ON DELETE RESTRICT,
  observed_at timestamptz NOT NULL DEFAULT now(),
  total_fulfillment_orders integer NOT NULL DEFAULT 0 CHECK (total_fulfillment_orders >= 0),
  delivered_fulfillment_orders integer NOT NULL DEFAULT 0 CHECK (delivered_fulfillment_orders >= 0),
  open_exceptions integer NOT NULL DEFAULT 0 CHECK (open_exceptions >= 0),
  critical_exceptions integer NOT NULL DEFAULT 0 CHECK (critical_exceptions >= 0),
  oldest_exception_at timestamptz,
  delivery_progress numeric(8,5) NOT NULL DEFAULT 0 CHECK (delivery_progress >= 0 AND delivery_progress <= 1),
  health text NOT NULL CHECK (health IN ('GREEN','AMBER','RED')),
  UNIQUE(order_id, observed_at)
);
CREATE INDEX IF NOT EXISTS idx_global_fulfillment_sla_order ON trust_global_fulfillment_sla_snapshots(order_id, observed_at DESC);
