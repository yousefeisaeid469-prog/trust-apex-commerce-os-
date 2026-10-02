import type { PoolClient } from 'pg';
import { allocateFulfillmentOrderTx, assertFulfillmentAllocationsReadyTx, transitionFulfillmentAllocationsTx } from './fulfillment-allocation.ts';
import { executeFulfillmentHandoffTx } from './fulfillment-inventory-execution.ts';
import { receiveInventoryTransactionTx } from '../commerce/inventory/transaction-engine.ts';

const moneyInt = (v: unknown) => Math.max(0, Math.floor(Number.isFinite(Number(v)) ? Number(v) : 0));
const transitions: Record<string,string[]> = {
  PLANNED:['PICKING','EXCEPTION','CANCELLED'],
  PICKING:['PACKED','EXCEPTION','CANCELLED'],
  PACKED:['READY_FOR_HANDOFF','EXCEPTION','CANCELLED'],
  READY_FOR_HANDOFF:['HANDED_OFF','EXCEPTION','CANCELLED'],
  HANDED_OFF:['DELIVERED','EXCEPTION'],
  DELIVERED:[],
  EXCEPTION:['PICKING','PACKED','READY_FOR_HANDOFF','HANDED_OFF','DELIVERED','CANCELLED'],
  CANCELLED:[],
};

export function canTransitionFulfillment(from:string,to:string){return from===to||Boolean(transitions[from]?.includes(to));}

async function emitEvent(tx:PoolClient,input:{fulfillmentOrderId:string;fromStatus:string|null;toStatus:string;actorId?:string;eventKey:string;metadata?:Record<string,unknown>}){
  await tx.query(`insert into trust_marketplace_fulfillment_events(fulfillment_order_id,from_status,to_status,actor_id,event_key,metadata_json) values($1,$2,$3,$4,$5,$6::jsonb) on conflict(event_key) do nothing`,[input.fulfillmentOrderId,input.fromStatus,input.toStatus,input.actorId??null,input.eventKey,JSON.stringify(input.metadata??{})]);
}

async function ensureFulfillmentShipmentTx(tx:PoolClient, input:{fulfillmentOrderId:string;merchantId:string;idempotencyKey:string}){
  const f=(await tx.query<any>(`select * from trust_marketplace_fulfillment_orders where id=$1 and merchant_id=$2 for update`,[input.fulfillmentOrderId,input.merchantId])).rows[0];
  if(!f) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');
  if(f.shipment_id){
    const existing=(await tx.query<any>(`select id,order_id,fulfillment_order_id,status from trust_shipments where id=$1 for update`,[f.shipment_id])).rows[0];
    if(!existing) throw new Error('FULFILLMENT_SHIPMENT_REFERENCE_BROKEN');
    return {...existing,replay:true};
  }
  const carrier=String(process.env.TRUST_DEFAULT_CARRIER??'').trim();
  const service=String(process.env.TRUST_DEFAULT_FULFILLMENT_SERVICE??'').trim();
  if(!carrier||!service) throw new Error('FULFILLMENT_PROVIDER_NOT_CONFIGURED');
  const key=`fulfillment-shipment:${f.id}:${input.idempotencyKey}`;
  const old=(await tx.query<any>(`select id,order_id,fulfillment_order_id,status from trust_shipments where idempotency_key=$1 for update`,[key])).rows[0];
  if(old){
    await tx.query(`update trust_marketplace_fulfillment_orders set shipment_id=$2,updated_at=now() where id=$1`,[f.id,old.id]);
    return {...old,replay:true};
  }
  const r=await tx.query<any>(`insert into trust_shipments(id,order_id,fulfillment_order_id,carrier,service,status,destination,warehouse_id,idempotency_key) values(gen_random_uuid(),$1,$2,$3,$4,'PLANNED',$5::jsonb,$6,$7) returning id,order_id,fulfillment_order_id,status,carrier,service`,[f.order_id,f.id,carrier,service,JSON.stringify({region:f.destination_region}),f.location_id??null,key]);
  const shipment=r.rows[0];
  await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','PLANNED',now(),'Shipment planned from marketplace fulfillment order') on conflict(id) do nothing`,[`fulfillment:${f.id}:shipment:planned`,shipment.id]);
  await tx.query(`update trust_marketplace_fulfillment_orders set shipment_id=$2,updated_at=now() where id=$1`,[f.id,shipment.id]);
  await emitEvent(tx,{fulfillmentOrderId:f.id,fromStatus:f.status,toStatus:f.status,eventKey:`fulfillment:${f.id}:shipment-created`,metadata:{shipmentId:shipment.id,carrier,service}});
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.shipment.created',$1,$2::jsonb)`,[f.id,JSON.stringify({fulfillmentOrderId:f.id,shipmentId:shipment.id,orderId:f.order_id,merchantId:f.merchant_id})]);
  return {...shipment,replay:false};
}

export async function createFulfillmentOrderTx(tx:PoolClient,input:{orderShipmentId:string;merchantId:string;programCode?:'PLATFORM_FULFILLMENT'|'MULTICHANNEL_FULFILLMENT'|'SELLER_FULFILLED';idempotencyKey:string;sellerOrderId?:string}){
  const old=await tx.query<any>(`select * from trust_marketplace_fulfillment_orders where idempotency_key=$1 for update`,[input.idempotencyKey]);
  if(old.rows[0]) return {...old.rows[0],replay:true};
  const s=(await tx.query<any>(`select * from trust_order_shipments where id=$1 and merchant_id=$2 for update`,[input.orderShipmentId,input.merchantId])).rows[0];
  if(!s) throw new Error('ORDER_SHIPMENT_NOT_FOUND_OR_NOT_OWNED');
  const program=input.programCode??'PLATFORM_FULFILLMENT';
  const items=(await tx.query<any>(`select oi.product_id,oi.offer_id,oi.quantity from trust_order_items oi where oi.order_id=$1 and ($2::uuid is null or oi.seller_order_id=$2) order by oi.id`,[s.order_id,input.sellerOrderId??null])).rows;
  const offerIds=Array.isArray(s.offer_ids)?s.offer_ids.map((x:any)=>String(x)):[];
  const relevant = offerIds.length ? items.filter((x:any)=>offerIds.includes(String(x.offer_id))) : items;
  if(!relevant.length) throw new Error('FULFILLMENT_ITEMS_NOT_FOUND');
  const itemCount=relevant.reduce((n:any,x:any)=>n+moneyInt(x.quantity),0);
  if(itemCount<1) throw new Error('FULFILLMENT_ITEM_COUNT_INVALID');
  const r=await tx.query<any>(`insert into trust_marketplace_fulfillment_orders(order_id,order_shipment_id,merchant_id,location_id,program_code,item_count,min_days,max_days,destination_region,idempotency_key,seller_order_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,[s.order_id,s.id,input.merchantId,s.location_id??null,program,itemCount,s.min_days,s.max_days,s.destination_region,input.idempotencyKey,input.sellerOrderId??null]);
  const fo=r.rows[0];
  await allocateFulfillmentOrderTx(tx, { fulfillmentOrderId: String(fo.id), merchantId: input.merchantId, idempotencyKey: `${input.idempotencyKey}:allocation` });
  await emitEvent(tx,{fulfillmentOrderId:fo.id,fromStatus:null,toStatus:'PLANNED',eventKey:`fulfillment:${fo.id}:PLANNED`});
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.fulfillment.planned',$1,$2::jsonb)`,[fo.id,JSON.stringify({fulfillmentOrderId:fo.id,orderId:s.order_id,merchantId:input.merchantId,locationId:s.location_id??null,itemCount})]);
  return {...fo,replay:false};
}

export async function bindFulfillmentShipmentTx(tx:PoolClient,input:{fulfillmentOrderId:string;merchantId:string;shipmentId:string;idempotencyKey:string}){
  const f=(await tx.query<any>(`select * from trust_marketplace_fulfillment_orders where id=$1 and merchant_id=$2 for update`,[input.fulfillmentOrderId,input.merchantId])).rows[0];
  if(!f) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');
  const s=(await tx.query<any>(`select id,order_id,fulfillment_order_id,status from trust_shipments where id=$1 for update`,[input.shipmentId])).rows[0];
  if(!s||s.order_id!==f.order_id) throw new Error('SHIPMENT_ORDER_MISMATCH');
  if(s.fulfillment_order_id && s.fulfillment_order_id!==f.id) throw new Error('SHIPMENT_ALREADY_BOUND_TO_FULFILLMENT');
  if(f.shipment_id && f.shipment_id!==s.id) throw new Error('FULFILLMENT_SHIPMENT_ALREADY_BOUND');
  await tx.query(`update trust_marketplace_fulfillment_orders set shipment_id=$2,updated_at=now() where id=$1`,[f.id,s.id]);
  await tx.query(`update trust_shipments set fulfillment_order_id=$2,updated_at=now() where id=$1 and fulfillment_order_id is null`,[s.id,f.id]);
  await emitEvent(tx,{fulfillmentOrderId:f.id,fromStatus:f.status,toStatus:f.status,eventKey:`fulfillment:${f.id}:shipment:${s.id}`,metadata:{shipmentId:s.id,idempotencyKey:input.idempotencyKey}});
  return {fulfillmentOrderId:f.id,shipmentId:s.id,status:f.status,replay:Boolean(f.shipment_id===s.id)};
}

export async function transitionFulfillmentOrderTx(tx:PoolClient,input:{fulfillmentOrderId:string;merchantId:string;toStatus:string;actorId?:string;idempotencyKey:string}){
  const f=(await tx.query<any>(`select * from trust_marketplace_fulfillment_orders where id=$1 and merchant_id=$2 for update`,[input.fulfillmentOrderId,input.merchantId])).rows[0];
  if(!f) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');
  if(f.status===input.toStatus) return {fulfillmentOrderId:f.id,status:f.status,replay:true};
  if(!canTransitionFulfillment(f.status,input.toStatus)) throw new Error(`INVALID_FULFILLMENT_TRANSITION:${f.status}->${input.toStatus}`);
  if(input.toStatus==='PICKING') await assertFulfillmentAllocationsReadyTx(tx, String(f.id));
  if(input.toStatus==='READY_FOR_HANDOFF' || input.toStatus==='HANDED_OFF') {
    const shipment=await ensureFulfillmentShipmentTx(tx,{fulfillmentOrderId:String(f.id),merchantId:String(f.merchant_id),idempotencyKey:`${input.idempotencyKey}:shipment`});
    f.shipment_id=shipment.id;
    if(input.toStatus==='READY_FOR_HANDOFF' && shipment.status==='PLANNED') {
      await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','LABEL_CREATED',now(),'Fulfillment label created') on conflict(id) do nothing`,[`fulfillment:${f.id}:shipment:label-created`,shipment.id]);
      await tx.query(`update trust_shipments set status='LABEL_CREATED',updated_at=now() where id=$1 and status='PLANNED'`,[shipment.id]);
    }
  }
  if(input.toStatus==='HANDED_OFF') {
    await executeFulfillmentHandoffTx(tx,{fulfillmentOrderId:String(f.id),merchantId:String(f.merchant_id),idempotencyKey:`${input.idempotencyKey}:inventory-handoff`});
    const s=(await tx.query<any>(`select status from trust_shipments where id=$1 for update`,[f.shipment_id])).rows[0];
    if(s?.status==='LABEL_CREATED') {
      await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','PICKED_UP',now(),'Fulfillment handed to carrier') on conflict(id) do nothing`,[`fulfillment:${f.id}:shipment:picked-up`,f.shipment_id]);
      await tx.query(`update trust_shipments set status='PICKED_UP',updated_at=now() where id=$1`,[f.shipment_id]);
    }
  }
  if(input.toStatus==='DELIVERED'){
    if(!f.shipment_id) throw new Error('SHIPMENT_REQUIRED_BEFORE_DELIVERY');
    const s=(await tx.query<any>(`select status from trust_shipments where id=$1 for update`,[f.shipment_id])).rows[0];
    if(!s || s.status!=='DELIVERED') throw new Error('SHIPMENT_NOT_DELIVERED');
  }
  const patch=input.toStatus==='PACKED'?`,packed_at=now()`:input.toStatus==='HANDED_OFF'?`,handed_off_at=now()`:input.toStatus==='DELIVERED'?`,delivered_at=now()`:'';
  await tx.query(`update trust_marketplace_fulfillment_orders set status=$2${patch},updated_at=now() where id=$1`,[f.id,input.toStatus]);
  const custodyStatus=input.toStatus==='PICKING'?'PICKED':input.toStatus==='PACKED'?'PACKED':input.toStatus==='HANDED_OFF'?'HANDED_OFF':input.toStatus==='DELIVERED'?'RELEASED':input.toStatus==='EXCEPTION'?'EXCEPTION':null;
  if(custodyStatus) await tx.query(`update trust_marketplace_fulfillment_custody set status=$2,updated_at=now() where fulfillment_order_id=$1`,[f.id,custodyStatus]);
  await transitionFulfillmentAllocationsTx(tx,{fulfillmentOrderId:String(f.id),toStatus:input.toStatus});
  await emitEvent(tx,{fulfillmentOrderId:f.id,fromStatus:f.status,toStatus:input.toStatus,actorId:input.actorId,eventKey:input.idempotencyKey});
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.fulfillment.status_changed',$1,$2::jsonb)`,[f.id,JSON.stringify({fulfillmentOrderId:f.id,orderId:f.order_id,fromStatus:f.status,toStatus:input.toStatus,shipmentId:f.shipment_id??null})]);
  if(input.toStatus==='DELIVERED' && f.seller_order_id){
    const so=(await tx.query<any>(`select id,status from trust_seller_orders where id=$1 for update`,[f.seller_order_id])).rows[0];
    if(so && so.status!=='DELIVERED' && so.status!=='REFUNDED' && so.status!=='CANCELLED'){
      await tx.query(`update trust_seller_orders set status='DELIVERED',updated_at=now() where id=$1`,[so.id]);
      await tx.query(`insert into trust_seller_order_events(seller_order_id,from_status,to_status,event_key,metadata_json) values($1,$2,'DELIVERED',$3,$4::jsonb) on conflict(event_key) do nothing`,[so.id,so.status,`fulfillment:${f.id}:seller-delivered`,JSON.stringify({source:'fulfillment',fulfillmentOrderId:f.id,shipmentId:f.shipment_id??null})]);
    }
  }
  return {fulfillmentOrderId:f.id,status:input.toStatus,replay:false};
}

export async function receiveInventoryTx(tx:PoolClient,input:{locationId:string;productId:string;offerId?:string;quantity:number;referenceKey:string;note?:string}){
  const qty=moneyInt(input.quantity); if(qty<1) throw new Error('INVALID_INBOUND_QUANTITY');
  const result=await receiveInventoryTransactionTx(tx,{
    locationId:input.locationId, productId:input.productId, offerId:input.offerId, quantity:qty,
    idempotencyKey:input.referenceKey, source:'FULFILLMENT_INBOUND', metadata:{note:input.note??null},
  });
  const movement=(await tx.query<any>(`select id from trust_marketplace_inventory_movements where reference_key=$1`,[input.referenceKey])).rows[0];
  return {movementId:movement?.id??null,replay:result.replay,quantity:qty,transactionId:result.transactionId};
}
