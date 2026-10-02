-- TRUST V122: Merchant Supergraph durability contract
CREATE TABLE IF NOT EXISTS trust_merchant_graph_nodes (
  node_id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','VERIFIED','SUSPENDED')),
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_merchant_graph_edges (
  edge_id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL,
  to_node TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('OFFERS','FULFILLS','SERVES_REGION','REPUTATION')),
  weight NUMERIC(10,4),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_node, to_node, relation)
);
CREATE INDEX IF NOT EXISTS idx_trust_graph_edges_from ON trust_merchant_graph_edges(from_node, relation);
CREATE INDEX IF NOT EXISTS idx_trust_graph_edges_to ON trust_merchant_graph_edges(to_node, relation);
CREATE TABLE IF NOT EXISTS trust_routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  region_code TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selected_offer_id TEXT,
  score NUMERIC(6,2),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_routing_product_time ON trust_routing_decisions(product_id, created_at DESC);
