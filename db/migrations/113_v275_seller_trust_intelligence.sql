-- V275 — Seller Trust Intelligence
-- Durable seller performance facts used by marketplace ranking.
-- Unknown dimensions stay neutral; the score never fabricates performance data.

CREATE TABLE IF NOT EXISTS trust_marketplace_seller_performance (
  merchant_id uuid PRIMARY KEY REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  orders_total integer NOT NULL DEFAULT 0 CHECK (orders_total >= 0),
  orders_on_time integer NOT NULL DEFAULT 0 CHECK (orders_on_time >= 0 AND orders_on_time <= orders_total),
  cancellations integer NOT NULL DEFAULT 0 CHECK (cancellations >= 0 AND cancellations <= orders_total),
  returns integer NOT NULL DEFAULT 0 CHECK (returns >= 0 AND returns <= orders_total),
  defects integer NOT NULL DEFAULT 0 CHECK (defects >= 0 AND defects <= orders_total),
  stockouts integer NOT NULL DEFAULT 0 CHECK (stockouts >= 0),
  ratings_count integer NOT NULL DEFAULT 0 CHECK (ratings_count >= 0),
  rating_sum numeric(14,4) NOT NULL DEFAULT 0 CHECK (rating_sum >= 0),
  last_event_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_marketplace_seller_performance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('ORDER_ACCEPTED','ORDER_ON_TIME','ORDER_CANCELLED','RETURN_ACCEPTED','DEFECT_REPORTED','INVENTORY_STOCKOUT','CUSTOMER_RATING')),
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_seller_perf_events_merchant ON trust_marketplace_seller_performance_events(merchant_id, created_at DESC);

-- Bootstrap only what the existing marketplace truth already knows: rating, order count and return rate.
-- Other dimensions intentionally remain unknown/neutral until real events arrive.
INSERT INTO trust_marketplace_seller_performance(merchant_id,orders_total,ratings_count,rating_sum,returns)
SELECT o.merchant_id,
       max(o.seller_orders),
       CASE WHEN max(o.seller_orders) > 0 THEN max(o.seller_orders) ELSE 0 END,
       max(o.seller_rating) * max(greatest(o.seller_orders,0)),
       round(max(o.seller_orders) * max(o.return_rate_bps) / 10000.0)::int
FROM trust_marketplace_offers o
GROUP BY o.merchant_id
ON CONFLICT(merchant_id) DO UPDATE SET
  orders_total = greatest(trust_marketplace_seller_performance.orders_total, excluded.orders_total),
  ratings_count = greatest(trust_marketplace_seller_performance.ratings_count, excluded.ratings_count),
  rating_sum = greatest(trust_marketplace_seller_performance.rating_sum, excluded.rating_sum),
  returns = greatest(trust_marketplace_seller_performance.returns, excluded.returns),
  updated_at = now();

CREATE INDEX IF NOT EXISTS idx_seller_perf_quality ON trust_marketplace_seller_performance(orders_total, updated_at DESC);
