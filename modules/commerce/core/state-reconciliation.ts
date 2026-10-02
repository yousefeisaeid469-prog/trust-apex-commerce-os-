import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';

export const COMMERCE_STATE_RECONCILIATION_VERSION = 'V419.0.0';

export type CommerceState =
  | 'CHECKOUT_COMMITTED' | 'PAYMENT_PENDING' | 'PAYMENT_CAPTURED' | 'EXECUTION'
  | 'FULFILLMENT' | 'DELIVERY' | 'SETTLEMENT' | 'COMPLETED' | 'BLOCKED' | 'REFUNDED' | 'UNKNOWN';

export type StateObservation = {
  lastEventId: string | null; lastCommandId: string | null;
  orderStatus: string; paymentStatus: string | null; executionStatus: string | null;
  fulfillmentCount: number; deliveredFulfillmentCount: number; shipmentCount: number;
  deliveredShipmentCount: number; settlementStatus: string | null; runtimeStatus: string | null;
  receiptPresent: boolean; executionJobCount: number;
};

export function deriveCommerceState(o: StateObservation): CommerceState {
  if (o.orderStatus === 'refunded' || o.executionStatus === 'REFUNDED') return 'REFUNDED';
  if (o.executionStatus === 'COMPLETED') return 'COMPLETED';
  if (o.executionStatus === 'SETTLEMENT_RELEASED' || o.settlementStatus === 'RELEASED') return 'SETTLEMENT';
  if (o.deliveredShipmentCount > 0 && o.shipmentCount > 0 && o.deliveredShipmentCount === o.shipmentCount) return 'DELIVERY';
  if (o.fulfillmentCount > 0 && o.deliveredFulfillmentCount < o.fulfillmentCount) return 'FULFILLMENT';
  if (o.executionStatus) return 'EXECUTION';
  if (o.paymentStatus === 'captured') return 'PAYMENT_CAPTURED';
  if (o.paymentStatus) return 'PAYMENT_PENDING';
  if (o.receiptPresent) return 'CHECKOUT_COMMITTED';
  return 'UNKNOWN';
}

const NEXT: Record<CommerceState, CommerceState | null> = {
  CHECKOUT_COMMITTED:'PAYMENT_PENDING', PAYMENT_PENDING:'PAYMENT_CAPTURED', PAYMENT_CAPTURED:'EXECUTION',
  EXECUTION:'FULFILLMENT', FULFILLMENT:'DELIVERY', DELIVERY:'SETTLEMENT', SETTLEMENT:'COMPLETED',
  COMPLETED:null, BLOCKED:null, REFUNDED:null, UNKNOWN:'CHECKOUT_COMMITTED',
};

export function expectedNextCommerceState(state: CommerceState): CommerceState | null { return NEXT[state]; }

export function reconcileStateObservation(o: StateObservation) {
  const state = deriveCommerceState(o);
  const divergence:string[]=[];
  let recommendedAction='NONE';
  if (o.paymentStatus === 'captured' && !o.executionStatus) { divergence.push('CAPTURED_PAYMENT_WITHOUT_EXECUTION'); recommendedAction='RESUME_EXECUTION'; }
  if (o.executionStatus && o.fulfillmentCount===0 && ['FULFILLMENT_PLANNED','IN_FULFILLMENT','DELIVERED'].includes(o.executionStatus)) { divergence.push('EXECUTION_WITHOUT_FULFILLMENT'); recommendedAction='RESUME_EXECUTION'; }
  if (o.settlementStatus && o.shipmentCount>0 && o.deliveredShipmentCount<o.shipmentCount) { divergence.push('SETTLEMENT_BEFORE_DELIVERY'); recommendedAction='BLOCK_SETTLEMENT_RECONCILIATION'; }
  if (o.executionStatus==='COMPLETED' && !o.settlementStatus) { divergence.push('COMPLETED_WITHOUT_SETTLEMENT'); recommendedAction='BLOCK_FINANCIAL_REPAIR'; }
  if (o.orderStatus==='delivered' && o.shipmentCount>0 && o.deliveredShipmentCount===o.shipmentCount && !o.settlementStatus) { divergence.push('DELIVERED_WITHOUT_SETTLEMENT'); recommendedAction='BLOCK_FINANCIAL_REPAIR'; }
  if (o.receiptPresent && !o.runtimeStatus && ['captured','processing','shipped','delivered'].includes(o.orderStatus)) { divergence.push('ACTIVE_ORDER_WITHOUT_RUNTIME'); recommendedAction='ENSURE_RUNTIME'; }
  const status = divergence.some(x=>x.includes('FINANCIAL') || x==='SETTLEMENT_BEFORE_DELIVERY') ? 'BLOCKED' : divergence.length ? 'DRIFT' : 'ALIGNED';
  return {state,expectedNextState:expectedNextCommerceState(state),divergenceCodes:divergence,recommendedAction,reconciliationStatus:status};
}

async function observationTx(tx:PoolClient, orderId:string):Promise<StateObservation> {
  const [o,r,p,e,f,s,st,rt,j,ev,cmd] = await Promise.all([
    tx.query<any>(`select status from trust_orders where id=$1`,[orderId]),
    tx.query<any>(`select 1 from trust_commerce_execution_receipts where order_id=$1 limit 1`,[orderId]),
    tx.query<any>(`select status from trust_payments where order_id=$1 order by created_at desc,id desc limit 1`,[orderId]),
    tx.query<any>(`select status from trust_commerce_execution_runs where order_id=$1 order by created_at desc,id desc limit 1`,[orderId]),
    tx.query<any>(`select count(*)::int count,count(*) filter(where status='DELIVERED')::int delivered from trust_marketplace_fulfillment_orders where order_id=$1`,[orderId]),
    tx.query<any>(`select count(*)::int count,count(*) filter(where status='DELIVERED')::int delivered from trust_shipments where order_id=$1`,[orderId]),
    tx.query<any>(`select status from trust_marketplace_payment_settlements where order_id=$1 order by created_at desc limit 1`,[orderId]),
    tx.query<any>(`select status from trust_runtime_operations where operation_type='commerce.order' and operation_key=$1 order by created_at desc limit 1`,[orderId]),
    tx.query<any>(`select count(*)::int count from trust_commerce_execution_jobs where order_id=$1 and status in ('PENDING','WAITING','PROCESSING')`,[orderId]),
    tx.query<any>(`select id from trust_outbox_events where aggregate_id=$1 order by created_at desc,id desc limit 1`,[orderId]),
    tx.query<any>(`select id from trust_commands where aggregate_id=$1 order by created_at desc,id desc limit 1`,[orderId]),
  ]);
  if(!o.rows[0]) throw new Error('ORDER_NOT_FOUND');
  return {lastEventId:ev.rows[0]?.id?String(ev.rows[0].id):null,lastCommandId:cmd.rows[0]?.id?String(cmd.rows[0].id):null,orderStatus:String(o.rows[0].status),paymentStatus:p.rows[0]?.status?String(p.rows[0].status):null,executionStatus:e.rows[0]?.status?String(e.rows[0].status):null,fulfillmentCount:Number(f.rows[0]?.count??0),deliveredFulfillmentCount:Number(f.rows[0]?.delivered??0),shipmentCount:Number(s.rows[0]?.count??0),deliveredShipmentCount:Number(s.rows[0]?.delivered??0),settlementStatus:st.rows[0]?.status?String(st.rows[0].status):null,runtimeStatus:rt.rows[0]?.status?String(rt.rows[0].status):null,receiptPresent:Boolean(r.rows[0]),executionJobCount:Number(j.rows[0]?.count??0)};
}

function hashObservation(o:StateObservation){ return createHash('sha256').update(JSON.stringify(o)).digest('hex'); }

export async function reconcileCommerceStateTx(tx:PoolClient, orderId:string) {
  const observation=await observationTx(tx,orderId);
  const result=reconcileStateObservation(observation);
  const observedHash=hashObservation(observation);
  const saved=(await tx.query<any>(`insert into trust_commerce_state_reconciliation(order_id,state_version,observed_state,expected_next_state,reconciliation_status,divergence_codes_json,authority_snapshot_json,observed_hash,last_event_id,last_command_id,recommended_action,last_reconciled_at,updated_at)
    values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,now(),now())
    on conflict(order_id) do update set state_version=excluded.state_version,observed_state=excluded.observed_state,expected_next_state=excluded.expected_next_state,reconciliation_status=excluded.reconciliation_status,divergence_codes_json=excluded.divergence_codes_json,authority_snapshot_json=excluded.authority_snapshot_json,observed_hash=excluded.observed_hash,last_event_id=excluded.last_event_id,last_command_id=excluded.last_command_id,recommended_action=excluded.recommended_action,last_reconciled_at=now(),updated_at=now()
    returning *`,[orderId,COMMERCE_STATE_RECONCILIATION_VERSION,result.state,result.expectedNextState,result.reconciliationStatus,JSON.stringify(result.divergenceCodes),JSON.stringify(observation),observedHash,observation.lastEventId,observation.lastCommandId,result.recommendedAction])).rows[0];
  if(result.reconciliationStatus!=='ALIGNED'){
    const eventKey=`state-reconciliation:${observedHash}`;
    await tx.query(`insert into trust_commerce_state_reconciliation_events(order_id,reconciliation_id,event_type,event_key,payload_json) values($1,$2,$3,$4,$5::jsonb) on conflict(order_id,event_type,event_key) do nothing`,[orderId,saved.id,'commerce.state.reconciliation.detected',eventKey,JSON.stringify({orderId,state:result.state,expectedNextState:result.expectedNextState,divergenceCodes:result.divergenceCodes,recommendedAction:result.recommendedAction})]);
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,event_key,payload_json,tenant_id) values('commerce.state.reconciliation.detected',$1,$2,$3::jsonb,'default') on conflict(tenant_id,event_type,aggregate_id,event_key) where event_key is not null do nothing`,[orderId,eventKey,JSON.stringify({orderId,state:result.state,divergenceCodes:result.divergenceCodes,recommendedAction:result.recommendedAction,observedHash})]);
  }
  return {...result,observation,observedHash,reconciliationId:String(saved.id),lastEventId:observation.lastEventId,lastCommandId:observation.lastCommandId};
}
