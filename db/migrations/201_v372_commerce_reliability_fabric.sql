-- V372 — End-to-End Commerce Reliability Fabric.
-- Durable graph over existing commerce authorities. This is an evidence index,
-- not a second source of truth: nodes are rebuilt from order/payment/inventory/
-- fulfillment/execution/revenue/event records and retain the source identifiers.
CREATE TABLE IF NOT EXISTS trust_commerce_reliability_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES trust_orders(id) ON DELETE CASCADE,
  correlation_id text NOT NULL,
  state text NOT NULL CHECK(state IN ('HEALTHY','DEGRADED','BLOCKED','UNKNOWN')),
  root_cause_code text,
  impact jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_correlations jsonb NOT NULL DEFAULT '[]'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_traces_state_idx
  ON trust_commerce_reliability_traces(state,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_reliability_trace_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES trust_commerce_reliability_traces(id) ON DELETE CASCADE,
  node_key text NOT NULL,
  domain text NOT NULL CHECK(domain IN ('EVENT','ORDER','PAYMENT','INVENTORY','FULFILLMENT','DELIVERY','SETTLEMENT','REVENUE','EXECUTION')),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  status text NOT NULL,
  occurred_at timestamptz,
  source_table text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trace_id,node_key)
);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_trace_nodes_entity_idx
  ON trust_commerce_reliability_trace_nodes(entity_type,entity_id);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_trace_nodes_domain_idx
  ON trust_commerce_reliability_trace_nodes(trace_id,domain,status);

CREATE TABLE IF NOT EXISTS trust_commerce_reliability_trace_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES trust_commerce_reliability_traces(id) ON DELETE CASCADE,
  from_node_key text NOT NULL,
  to_node_key text NOT NULL,
  relation text NOT NULL CHECK(relation IN ('CAUSES','DEPENDS_ON','FULFILLS','DELIVERS','SETTLES','GENERATES','OBSERVED_BY','EXECUTES')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trace_id,from_node_key,to_node_key,relation)
);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_trace_edges_trace_idx
  ON trust_commerce_reliability_trace_edges(trace_id);

COMMENT ON TABLE trust_commerce_reliability_traces IS
  'V372: evidence-backed end-to-end commerce reliability trace; rebuilt from authoritative commerce records.';
