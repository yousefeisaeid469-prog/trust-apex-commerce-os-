-- V293 — post-sale financial evidence, return inventory recovery, immutable accounting journals.
CREATE TABLE IF NOT EXISTS trust_post_sale_financial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK(event_type IN ('REFUND','SELLER_REFUND_REVERSAL','PAYOUT_REVERSAL','CHARGEBACK')),
  return_id uuid REFERENCES trust_returns(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  refund_id uuid REFERENCES trust_refunds(id) ON DELETE SET NULL,
  payout_id uuid REFERENCES trust_marketplace_payout_requests(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE SET NULL,
  amount numeric(18,2) NOT NULL CHECK(amount > 0),
  currency char(3) NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_sale_financial_events_return ON trust_post_sale_financial_events(return_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_sale_financial_events_merchant ON trust_post_sale_financial_events(merchant_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_return_inventory_recoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  return_item_id uuid NOT NULL REFERENCES trust_return_items(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK(quantity > 0),
  disposition text NOT NULL CHECK(disposition IN ('RESTOCK','QUARANTINE','RETURN_TO_VENDOR','DISPOSE')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(return_item_id)
);
CREATE INDEX IF NOT EXISTS idx_return_inventory_recoveries_return ON trust_return_inventory_recoveries(return_id,created_at DESC);

ALTER TABLE trust_marketplace_inventory_movements DROP CONSTRAINT IF EXISTS trust_marketplace_inventory_movements_movement_type_check;
ALTER TABLE trust_marketplace_inventory_movements ADD CONSTRAINT trust_marketplace_inventory_movements_movement_type_check
  CHECK(movement_type IN ('INBOUND_RECEIPT','DAMAGE','DAMAGE_RECOVERY','ADJUSTMENT','RETURN_RECEIPT'));

CREATE OR REPLACE FUNCTION trust_block_accounting_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ACCOUNTING_JOURNAL_IMMUTABLE';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_trust_accounting_entries_immutable ON trust_accounting_entries;
CREATE TRIGGER trg_trust_accounting_entries_immutable
BEFORE UPDATE OR DELETE ON trust_accounting_entries
FOR EACH ROW EXECUTE FUNCTION trust_block_accounting_mutation();
DROP TRIGGER IF EXISTS trg_trust_accounting_journals_immutable ON trust_accounting_journals;
CREATE TRIGGER trg_trust_accounting_journals_immutable
BEFORE UPDATE OR DELETE ON trust_accounting_journals
FOR EACH ROW EXECUTE FUNCTION trust_block_accounting_mutation();
