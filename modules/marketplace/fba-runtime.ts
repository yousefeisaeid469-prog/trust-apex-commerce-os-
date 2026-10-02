import type { PoolClient } from 'pg';
import { shipInventoryTransactionTx } from '../commerce/inventory/transaction-engine.ts';
const n=(v:unknown)=>Math.max(0,Number.isFinite(Number(v))?Number(v):0);
const i=(v:unknown)=>Math.max(0,Math.floor(n(v)));

export async function enrollFulfillmentProgramTx(tx:PoolClient,input:{merchantId:string;programId:string;serviceLevel?:'STANDARD'|'EXPRESS'|'PREMIUM';idempotencyKey:string}){
  const program=(await tx.query<any>(`select * from trust_marketplace_fulfillment_programs where id=$1 and merchant_id=$2 and status='ACTIVE'`,[input.programId,input.merchantId])).rows[0];
  if(!program) throw new Error('FULFILLMENT_PROGRAM_NOT_FOUND_OR_NOT_OWNED');
  const r=await tx.query<any>(`insert into trust_marketplace_fulfillment_enrollments(merchant_id,program_id,service_level) values($1,$2,$3) on conflict(merchant_id,program_id) do update set status='ACTIVE',service_level=excluded.service_level,updated_at=now() returning *`,[input.merchantId,input.programId,input.serviceLevel??'STANDARD']);
  return {...r.rows[0],replay:false,idempotencyKey:input.idempotencyKey};
}

export async function reserveFulfillmentInventoryTx(tx:PoolClient,input:{fulfillmentOrderId:string;merchantId:string;locationId:string;productId:string;offerId?:string;quantity:number;idempotencyKey:string}){
  const qty=i(input.quantity); if(qty<1) throw new Error('INVALID_RESERVATION_QUANTITY');
  const f=(await tx.query<any>(`select id,status,order_id from trust_marketplace_fulfillment_orders where id=$1 and merchant_id=$2 for update`,[input.fulfillmentOrderId,input.merchantId])).rows[0];
  if(!f) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');
  const old=(await tx.query<any>(`select * from trust_marketplace_inventory_reservations where idempotency_key=$1 for update`,[input.idempotencyKey])).rows[0];
  if(old) return {...old,replay:true};
  const inv=(await tx.query<any>(`select * from trust_fulfillment_inventory where location_id=$1 and product_id=$2 and offer_id is not distinct from $3 for update`,[input.locationId,input.productId,input.offerId??null])).rows[0];
  if(!inv) throw new Error('FULFILLMENT_INVENTORY_NOT_FOUND');
  const existing=(await tx.query<any>(`select quantity,status from trust_inventory_reservations where order_id=$1 and product_id=$2 and offer_id is not distinct from $3 and location_id=$4 and status in ('reserved','consumed') order by id limit 1`,[f.order_id,input.productId,input.offerId??null,input.locationId])).rows[0];
  if(Number(inv.reserved_units)<qty && !existing) throw new Error('INVENTORY_NOT_RESERVED_FOR_ORDER');
  const r=await tx.query<any>(`insert into trust_marketplace_inventory_reservations(fulfillment_order_id,merchant_id,location_id,offer_id,product_id,quantity,status,source,idempotency_key) values($1,$2,$3,$4,$5,$6,'RESERVED','CHECKOUT',$7) returning *`,[f.id,input.merchantId,input.locationId,input.offerId??null,input.productId,qty,input.idempotencyKey]);
  return {...r.rows[0],replay:false};
}

export async function dispatchFulfillmentOrderTx(tx:PoolClient,input:{fulfillmentOrderId:string;merchantId:string;idempotencyKey:string}){
  const f=(await tx.query<any>(`select * from trust_marketplace_fulfillment_orders where id=$1 and merchant_id=$2 for update`,[input.fulfillmentOrderId,input.merchantId])).rows[0];
  if(!f) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');
  if(f.status!=='HANDED_OFF') throw new Error('FULFILLMENT_MUST_BE_HANDED_OFF');
  const reservations=(await tx.query<any>(`select * from trust_marketplace_inventory_reservations where fulfillment_order_id=$1 and status='RESERVED' for update`,[f.id])).rows;
  for(const r of reservations){
    await shipInventoryTransactionTx(tx,{
      locationId:String(r.location_id), productId:String(r.product_id), offerId:r.offer_id?String(r.offer_id):undefined,
      fulfillmentOrderId:String(f.id), quantity:Number(r.quantity), idempotencyKey:`${input.idempotencyKey}:${r.id}`,
      source:'FBA_DISPATCH', metadata:{reservationStatus:'reserved',marketplaceReservationId:String(r.id)},
    });
    await tx.query(`update trust_marketplace_inventory_reservations set status='SHIPPED',updated_at=now() where id=$1`,[r.id]);
  }
  const program=(await tx.query<any>(`select p.* from trust_marketplace_fulfillment_programs p where p.merchant_id=$1 and p.program_code=$2 and p.status='ACTIVE' order by p.created_at limit 1`,[f.merchant_id,f.program_code])).rows[0];
  if(program){
    const pick=Number(program.pick_pack_rate)*Number(f.item_count);
    if(pick>0) await tx.query(`insert into trust_marketplace_fulfillment_cost_ledger(merchant_id,fulfillment_order_id,program_id,cost_type,quantity,unit_rate,amount,idempotency_key) values($1,$2,$3,'PICK_PACK',$4,$5,$6,$7) on conflict(idempotency_key) do nothing`,[f.merchant_id,f.id,program.id,f.item_count,program.pick_pack_rate,pick,input.idempotencyKey+':pickpack']);
  }
  return {fulfillmentOrderId:f.id,dispatchedReservations:reservations.length,replay:false};
}
