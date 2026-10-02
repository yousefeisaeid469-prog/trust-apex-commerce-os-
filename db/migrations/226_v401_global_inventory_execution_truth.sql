-- V401 — Global Inventory Execution Truth
-- Read authority for physical inventory state across checkout reservations,
-- fulfillment allocations/execution and warehouse inventory buckets.
-- This migration deliberately does not create another mutable stock counter.

ALTER TABLE trust_marketplace_inventory_movements
  DROP CONSTRAINT IF EXISTS trust_marketplace_inventory_movements_movement_type_check;
ALTER TABLE trust_marketplace_inventory_movements
  ADD CONSTRAINT trust_marketplace_inventory_movements_movement_type_check
  CHECK(movement_type IN (
    'INBOUND_RECEIPT','DAMAGE','DAMAGE_RECOVERY','ADJUSTMENT',
    'PICK','SHIP','RETURN_RECEIPT','STORAGE_ADJUSTMENT'
  ));

CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_inventory_truth_key
  ON trust_fulfillment_inventory(product_id,offer_id,location_id);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservations_truth_key
  ON trust_inventory_reservations(product_id,offer_id,status,location_id);
CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_allocations_truth_key
  ON trust_fulfillment_allocations(product_id,offer_id,status,location_id);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_movements_truth_key
  ON trust_marketplace_inventory_movements(product_id,offer_id,movement_type,created_at DESC);

CREATE OR REPLACE VIEW trust_inventory_execution_truth AS
WITH keys AS (
  SELECT id AS product_id, NULL::uuid AS offer_id FROM trust_products
  UNION
  SELECT product_id, id AS offer_id FROM trust_marketplace_offers
  UNION
  SELECT product_id, offer_id FROM trust_fulfillment_inventory
  UNION
  SELECT product_id, offer_id FROM trust_inventory_reservations
), warehouse AS (
  SELECT product_id, offer_id,
         count(*)::int AS location_count,
         coalesce(sum(on_hand_units),0)::int AS on_hand_units,
         coalesce(sum(available_units),0)::int AS available_units,
         coalesce(sum(reserved_units),0)::int AS reserved_units,
         coalesce(sum(inbound_units),0)::int AS inbound_units,
         coalesce(sum(damaged_units),0)::int AS damaged_units,
         bool_and(available_units + reserved_units = on_hand_units) AS bucket_invariant_holds
    FROM trust_fulfillment_inventory
   GROUP BY product_id, offer_id
), reservations AS (
  SELECT product_id, offer_id,
         coalesce(sum(quantity) FILTER (WHERE status='reserved'),0)::int AS active_reserved_units,
         coalesce(sum(quantity) FILTER (WHERE status='consumed'),0)::int AS consumed_reserved_units,
         coalesce(sum(quantity) FILTER (WHERE status IN ('released','expired')),0)::int AS released_units
    FROM trust_inventory_reservations
   GROUP BY product_id, offer_id
), allocations AS (
  SELECT product_id, offer_id,
         coalesce(sum(quantity) FILTER (WHERE status IN ('ALLOCATED','PICKED','PACKED','HANDED_OFF')),0)::int AS committed_units,
         coalesce(sum(quantity) FILTER (WHERE status='DELIVERED'),0)::int AS delivered_allocation_units,
         coalesce(sum(quantity) FILTER (WHERE status IN ('RELEASED','EXPIRED','CANCELLED')),0)::int AS released_allocation_units
    FROM trust_fulfillment_allocations
   GROUP BY product_id, offer_id
), movements AS (
  SELECT product_id, offer_id,
         coalesce(sum(abs(quantity)) FILTER (WHERE movement_type='SHIP'),0)::int AS shipped_units,
         coalesce(sum(quantity) FILTER (WHERE movement_type='RETURN_RECEIPT'),0)::int AS returned_units,
         coalesce(sum(abs(quantity)) FILTER (WHERE movement_type='DAMAGE'),0)::int AS damaged_movement_units,
         coalesce(sum(quantity) FILTER (WHERE movement_type='INBOUND_RECEIPT'),0)::int AS inbound_movement_units
    FROM trust_marketplace_inventory_movements
   GROUP BY product_id, offer_id
)
SELECT
  k.product_id,
  k.offer_id,
  p.merchant_id,
  p.active AS product_active,
  p.stock AS legacy_product_stock,
  o.status AS offer_status,
  o.stock AS legacy_offer_stock,
  coalesce(w.location_count,0) AS location_count,
  coalesce(w.on_hand_units,0) AS on_hand_units,
  coalesce(w.available_units,0) AS available_units,
  coalesce(w.reserved_units,0) AS warehouse_reserved_units,
  coalesce(w.inbound_units,0) AS inbound_units,
  coalesce(w.damaged_units,0) AS damaged_units,
  coalesce(r.active_reserved_units,0) AS active_reservation_units,
  coalesce(r.consumed_reserved_units,0) AS consumed_reservation_units,
  coalesce(r.released_units,0) AS released_reservation_units,
  coalesce(a.committed_units,0) AS committed_units,
  coalesce(a.delivered_allocation_units,0) AS delivered_allocation_units,
  coalesce(a.released_allocation_units,0) AS released_allocation_units,
  coalesce(m.shipped_units,0) AS shipped_units,
  coalesce(m.returned_units,0) AS returned_units,
  coalesce(m.damaged_movement_units,0) AS damaged_movement_units,
  coalesce(m.inbound_movement_units,0) AS inbound_movement_units,
  CASE WHEN w.location_count > 0 THEN w.available_units
       WHEN k.offer_id IS NOT NULL THEN coalesce(o.stock,0)
       ELSE coalesce(p.stock,0) END AS canonical_available_units,
  CASE WHEN w.location_count > 0 THEN 'FULFILLMENT_INVENTORY'
       WHEN k.offer_id IS NOT NULL THEN 'OFFER_STOCK'
       ELSE 'PRODUCT_STOCK' END AS availability_source,
  CASE
    WHEN w.location_count > 0 AND coalesce(w.available_units,0) + coalesce(w.reserved_units,0) <> coalesce(w.on_hand_units,0)
      THEN 'INVENTORY_BUCKET_CONFLICT'
    WHEN k.offer_id IS NOT NULL AND o.status='ACTIVE' AND w.location_count > 0 AND o.stock <> w.available_units
      THEN 'LEGACY_OFFER_STOCK_CONFLICT'
    WHEN k.offer_id IS NOT NULL AND o.status='ACTIVE' AND w.location_count = 0 AND o.stock < 0
      THEN 'INVALID_OFFER_STOCK'
    WHEN k.offer_id IS NULL AND w.location_count = 0 AND p.stock < 0
      THEN 'INVALID_PRODUCT_STOCK'
    WHEN (CASE WHEN w.location_count > 0 THEN w.available_units WHEN k.offer_id IS NOT NULL THEN coalesce(o.stock,0) ELSE coalesce(p.stock,0) END) > 0
      THEN 'AVAILABLE'
    ELSE 'OUT_OF_STOCK'
  END AS execution_status
FROM keys k
JOIN trust_products p ON p.id=k.product_id
LEFT JOIN trust_marketplace_offers o ON o.id=k.offer_id
LEFT JOIN warehouse w ON w.product_id=k.product_id AND w.offer_id IS NOT DISTINCT FROM k.offer_id
LEFT JOIN reservations r ON r.product_id=k.product_id AND r.offer_id IS NOT DISTINCT FROM k.offer_id
LEFT JOIN allocations a ON a.product_id=k.product_id AND a.offer_id IS NOT DISTINCT FROM k.offer_id
LEFT JOIN movements m ON m.product_id=k.product_id AND m.offer_id IS NOT DISTINCT FROM k.offer_id;

COMMENT ON VIEW trust_inventory_execution_truth IS
  'V401 read authority: on-hand, available, reserved, committed, shipped and returned inventory execution state. No mutable stock counter is introduced.';
