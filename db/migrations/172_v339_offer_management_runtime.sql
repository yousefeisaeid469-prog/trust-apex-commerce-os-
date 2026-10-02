-- V339 — Seller offer management runtime.
-- Makes price/stock/promise/status changes durable, attributable and concurrency-safe.

ALTER TABLE trust_marketplace_offers
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1 CHECK (revision > 0);

CREATE TABLE IF NOT EXISTS trust_marketplace_offer_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  revision integer NOT NULL CHECK (revision > 0),
  change_type text NOT NULL CHECK (change_type IN ('CREATED','UPDATED','STATUS_CHANGED','STOCK_ADJUSTED')),
  before_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_offer_change_log_merchant
  ON trust_marketplace_offer_change_log(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_change_log_offer
  ON trust_marketplace_offer_change_log(offer_id, created_at DESC);

CREATE OR REPLACE FUNCTION trust_record_offer_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO trust_marketplace_offer_change_log
    (offer_id,merchant_id,revision,change_type,before_json,after_json)
  VALUES
    (NEW.id,NEW.merchant_id,NEW.revision,'CREATED','{}'::jsonb,
     jsonb_build_object('price',NEW.price,'shippingFee',NEW.shipping_fee,'stock',NEW.stock,
       'handlingDays',NEW.handling_days,'deliveryMinDays',NEW.delivery_min_days,
       'deliveryMaxDays',NEW.delivery_max_days,'fulfillmentMode',NEW.fulfillment_mode,'status',NEW.status));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_offer_created ON trust_marketplace_offers;
CREATE TRIGGER trg_record_offer_created
AFTER INSERT ON trust_marketplace_offers
FOR EACH ROW EXECUTE FUNCTION trust_record_offer_created();
