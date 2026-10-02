import type {PoolClient} from 'pg';
import {query,withPgTransaction} from '../db/postgres';
import {completeGlobalDeliveryTx} from '../global-order-v302/execution';
import {openFulfillmentExceptionTx} from '../global-fulfillment-v303/reliability';
import {releaseDeliveredSettlementTx} from '../../marketplace/financial-loop';
import {normalizeCarrierCode,normalizeTrackingNumber,shouldAdvance,type CarrierTrackingWebhook,type TrackingIngestResult} from './contracts';
export const GLOBAL_LOGISTICS_TRACKING_VERSION='V307.0.0';

export async function ingestCarrierTrackingTx(tx:PoolClient,input:CarrierTrackingWebhook):Promise<TrackingIngestResult>{
  const carrier=normalizeCarrierCode(input.carrierCode),tracking=normalizeTrackingNumber(input.trackingNumber),externalId=input.externalEventId.trim();
  if(!externalId) throw new Error('EXTERNAL_EVENT_ID_REQUIRED');
  const prior=(await tx.query<any>(`select id,reconciliation,shipment_id,status from trust_global_logistics_tracking_events where carrier_code=$1 and external_event_id=$2 for update`,[carrier,externalId])).rows[0];
  if(prior) return {reconciliation:'DUPLICATE',eventId:String(prior.id),shipmentId:prior.shipment_id??undefined,status:prior.status};
  const shipment=(await tx.query<any>(`select id,order_id,carrier,tracking_number,status,last_carrier_event_at from trust_shipments where carrier=$1 and tracking_number=$2 for update`,[carrier,tracking])).rows[0];
  const occurredAt=new Date(input.occurredAt); if(Number.isNaN(occurredAt.getTime())) throw new Error('INVALID_OCCURRED_AT');
  if(!shipment){
    const ev=(await tx.query<any>(`insert into trust_global_logistics_tracking_events(carrier_code,external_event_id,tracking_number,status,exception_code,occurred_at,location,description,eta_at,payload,reconciliation) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,'UNMATCHED') returning id`,[carrier,externalId,tracking,input.status,input.exceptionCode??null,occurredAt.toISOString(),input.location??null,input.description??null,input.etaAt??null,JSON.stringify(input.payload??{})])).rows[0];
    return {reconciliation:'UNMATCHED',eventId:String(ev.id),status:input.status};
  }
  const current=String(shipment.status) as any;
  const stale=shipment.last_carrier_event_at && new Date(shipment.last_carrier_event_at).getTime()>occurredAt.getTime();
  const canAdvance=shouldAdvance(current,input.status);
  const reconciliation=stale||!canAdvance?'STALE':'APPLIED';
  const ev=(await tx.query<any>(`insert into trust_global_logistics_tracking_events(carrier_code,external_event_id,shipment_id,tracking_number,status,exception_code,occurred_at,location,description,eta_at,payload,reconciliation) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12) returning id`,[carrier,externalId,shipment.id,tracking,input.status,input.exceptionCode??null,occurredAt.toISOString(),input.location??null,input.description??null,input.etaAt??null,JSON.stringify(input.payload??{}),reconciliation])).rows[0];
  if(reconciliation==='APPLIED'){
    const result=await recordTrackingEventTx(tx,{shipmentId:String(shipment.id),status:input.status,occurredAt:occurredAt.toISOString(),location:input.location,description:input.description,exceptionCode:input.exceptionCode,etaAt:input.etaAt});
    await tx.query(`update trust_shipments set last_carrier_event_at=$2,carrier_event_version=carrier_event_version+1,updated_at=now() where id=$1`,[shipment.id,occurredAt.toISOString()]);
    return {reconciliation:'APPLIED',eventId:String(ev.id),shipmentId:String(shipment.id),status:result.status};
  }
  return {reconciliation:'STALE',eventId:String(ev.id),shipmentId:String(shipment.id),status:input.status};
}

async function recordTrackingEventTx(tx:PoolClient,input:{shipmentId:string;status:any;occurredAt:string;location?:string;description?:string;exceptionCode?:any;etaAt?:string}){
  // Same core state machine as fulfillment tracking, but reuses the open transaction to keep carrier receipt atomic.
  const id=`${input.shipmentId}:${input.occurredAt}:${input.status}:${input.description??''}`;
  const row=(await tx.query<any>(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,exception_code,occurred_at,location,description,eta_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(id) do nothing returning id,status`,[id,input.shipmentId,input.exceptionCode?'EXCEPTION':input.etaAt?'ETA_UPDATE':'STATUS',input.status,input.exceptionCode??null,input.occurredAt,input.location??null,input.description??null,input.etaAt??null])).rows[0];
  if(!row) return {status:input.status};
  await tx.query(`update trust_shipments set status=$1,eta_at=coalesce($2,eta_at),updated_at=now() where id=$3`,[input.status,input.etaAt??null,input.shipmentId]);
  const shipment=(await tx.query<any>(`select order_id from trust_shipments where id=$1 for update`,[input.shipmentId])).rows[0];
  if(input.status==='EXCEPTION' && input.exceptionCode){
    await openFulfillmentExceptionTx(tx,{orderId:String(shipment.order_id),shipmentId:input.shipmentId,code:input.exceptionCode,description:input.description??null,occurredAt:input.occurredAt});
  }
  const orderStatus=input.status==='EXCEPTION'?'processing':['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(input.status)?'shipped':null;
  if(orderStatus){
    const order=(await tx.query<any>(`select status from trust_orders where id=$1 for update`,[shipment.order_id])).rows[0];
    if(order && order.status!==orderStatus){
      await tx.query(`update trust_orders set status=$1,updated_at=now() where id=$2`,[orderStatus,shipment.order_id]);
      await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,$3,'global_carrier_tracking',$4)`,[shipment.order_id,order.status,orderStatus,input.description??`Carrier status ${input.status}`]);
    }
  }
  if(input.status==='DELIVERED'){
    const result=await completeGlobalDeliveryTx(tx,{orderId:String(shipment.order_id),shipmentId:input.shipmentId,triggerKey:`carrier-tracking-delivered:${input.shipmentId}:${id}`});
    if(!result.global){await releaseDeliveredSettlementTx(tx,{orderId:String(shipment.order_id),idempotencyKey:`delivery-release:${shipment.order_id}`});}
  }
  return {status:input.status};
}

export async function ingestCarrierTracking(input:CarrierTrackingWebhook){return withPgTransaction(tx=>ingestCarrierTrackingTx(tx,input));}
export async function listGlobalTracking(orderId:string){return (await query(`select e.id,e.carrier_code,e.external_event_id,e.tracking_number,e.status,e.exception_code,e.occurred_at,e.location,e.description,e.eta_at,e.reconciliation,e.created_at from trust_global_logistics_tracking_events e join trust_shipments s on s.id=e.shipment_id where s.order_id=$1 order by e.occurred_at desc`,[orderId])).rows;}
export async function trackingReconciliationSummary(orderId:string){return (await query(`select e.reconciliation,count(*)::int as count from trust_global_logistics_tracking_events e join trust_shipments s on s.id=e.shipment_id where s.order_id=$1 group by e.reconciliation order by e.reconciliation`,[orderId])).rows;}
