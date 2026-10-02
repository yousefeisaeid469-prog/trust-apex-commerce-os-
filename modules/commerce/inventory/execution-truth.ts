import { query } from '../../platform/db/postgres';

export type InventoryExecutionStatus = 'AVAILABLE'|'OUT_OF_STOCK'|'INVENTORY_BUCKET_CONFLICT'|'LEGACY_OFFER_STOCK_CONFLICT'|'INVALID_OFFER_STOCK'|'INVALID_PRODUCT_STOCK';
export type InventoryExecutionTruth = {
  productId:string; offerId?:string; merchantId:string; productActive:boolean;
  legacyProductStock:number; legacyOfferStock?:number; offerStatus?:string;
  locationCount:number; onHandUnits:number; availableUnits:number; warehouseReservedUnits:number;
  inboundUnits:number; damagedUnits:number; activeReservationUnits:number; consumedReservationUnits:number;
  releasedReservationUnits:number; committedUnits:number; deliveredAllocationUnits:number; releasedAllocationUnits:number;
  shippedUnits:number; returnedUnits:number; damagedMovementUnits:number; inboundMovementUnits:number;
  canonicalAvailableUnits:number; availabilitySource:'FULFILLMENT_INVENTORY'|'OFFER_STOCK'|'PRODUCT_STOCK';
  executionStatus:InventoryExecutionStatus;
};

function map(r:any):InventoryExecutionTruth { return {
  productId:String(r.product_id), offerId:r.offer_id?String(r.offer_id):undefined, merchantId:String(r.merchant_id),
  productActive:Boolean(r.product_active), legacyProductStock:Number(r.legacy_product_stock),
  legacyOfferStock:r.legacy_offer_stock==null?undefined:Number(r.legacy_offer_stock), offerStatus:r.offer_status==null?undefined:String(r.offer_status),
  locationCount:Number(r.location_count), onHandUnits:Number(r.on_hand_units), availableUnits:Number(r.available_units),
  warehouseReservedUnits:Number(r.warehouse_reserved_units), inboundUnits:Number(r.inbound_units), damagedUnits:Number(r.damaged_units),
  activeReservationUnits:Number(r.active_reservation_units), consumedReservationUnits:Number(r.consumed_reservation_units),
  releasedReservationUnits:Number(r.released_reservation_units), committedUnits:Number(r.committed_units),
  deliveredAllocationUnits:Number(r.delivered_allocation_units), releasedAllocationUnits:Number(r.released_allocation_units),
  shippedUnits:Number(r.shipped_units), returnedUnits:Number(r.returned_units), damagedMovementUnits:Number(r.damaged_movement_units),
  inboundMovementUnits:Number(r.inbound_movement_units), canonicalAvailableUnits:Number(r.canonical_available_units),
  availabilitySource:String(r.availability_source) as InventoryExecutionTruth['availabilitySource'],
  executionStatus:String(r.execution_status) as InventoryExecutionStatus,
}; }

export async function getInventoryExecutionTruth(productId:string, offerId?:string) {
  const r=await query(`select * from trust_inventory_execution_truth where product_id=$1 and offer_id is not distinct from $2 order by location_count desc limit 1`,[productId,offerId??null]);
  return r.rows[0]?map(r.rows[0]):null;
}

export async function listInventoryExecutionConflicts(limit=100) {
  const safe=Math.min(500,Math.max(1,Math.floor(limit)));
  const r=await query(`select * from trust_inventory_execution_truth where execution_status not in ('AVAILABLE','OUT_OF_STOCK') order by product_id,offer_id nulls first limit $1`,[safe]);
  return r.rows.map(map);
}

export const LIVE_POSTGRES_INVENTORY_EXECUTION_AUTHORITY=true;
