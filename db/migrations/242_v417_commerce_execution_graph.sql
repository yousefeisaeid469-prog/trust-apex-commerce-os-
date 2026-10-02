-- V417 — Global Commerce Execution Graph & Integrity
-- Durable projection only. Existing order/payment/inventory/fulfillment/settlement
-- tables remain authoritative; this table records the cross-domain graph and
-- its detected gaps for recovery/operations.

CREATE TABLE IF NOT EXISTS trust_commerce_execution_graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES trust_orders(id) ON DELETE CASCADE,
  graph_version text NOT NULL,
  graph_state text NOT NULL CHECK (graph_state IN ('HEALTHY','WAITING','BLOCKED','FAILED','COMPLETED','REFUNDED','INCOMPLETE')),
  nodes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  edges_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  gaps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  gap_count integer NOT NULL DEFAULT 0 CHECK (gap_count >= 0),
  last_evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trust_commerce_execution_graphs_state_idx
  ON trust_commerce_execution_graphs(graph_state,gap_count,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_execution_graphs_eval_idx
  ON trust_commerce_execution_graphs(last_evaluated_at DESC);

COMMENT ON TABLE trust_commerce_execution_graphs IS
  'V417 durable cross-domain execution graph projection. It is diagnostic/recovery state, never an order, payment, inventory, fulfillment, or settlement authority.';
