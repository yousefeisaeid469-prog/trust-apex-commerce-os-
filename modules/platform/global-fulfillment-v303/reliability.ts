import type { PoolClient } from 'pg';

export const GLOBAL_FULFILLMENT_RELIABILITY_VERSION = 'V303.0.0';
export type FulfillmentExceptionCode = 'ADDRESS_ISSUE'|'CUSTOMS_HOLD'|'DAMAGED'|'RECIPIENT_UNAVAILABLE'|'WEATHER_DELAY'|'CARRIER_DELAY'|'UNKNOWN';
export type ExceptionSeverity = 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type ExceptionStatus = 'OPEN'|'INVESTIGATING'|'ACTION_REQUIRED'|'RECOVERING'|'RESOLVED'|'ESCALATED';
export type RecoveryActionType = 'RETRY_TRACKING'|'REISSUE_LABEL'|'REROUTE'|'CUSTOMS_REVIEW'|'ADDRESS_REVIEW'|'CARRIER_ESCALATION'|'CUSTOMER_CONTACT'|'CANCEL_FULFILLMENT'|'MARK_RESOLVED';

const severityFor: Record<FulfillmentExceptionCode, ExceptionSeverity> = {
  ADDRESS_ISSUE:'HIGH', CUSTOMS_HOLD:'HIGH', DAMAGED:'CRITICAL', RECIPIENT_UNAVAILABLE:'MEDIUM',
  WEATHER_DELAY:'MEDIUM', CARRIER_DELAY:'HIGH', UNKNOWN:'HIGH'
};

export async function openFulfillmentExceptionTx(tx: PoolClient, input: {
  orderId: string; shipmentId: string; code: FulfillmentExceptionCode; description?: string|null; occurredAt?: string;
}) {
  const shipment = (await tx.query<any>(`select s.id,s.order_id,f.id fulfillment_order_id,f.global_orchestration_id from trust_shipments s left join trust_marketplace_fulfillment_orders f on f.shipment_id=s.id where s.id=$1 for update`, [input.shipmentId])).rows[0];
  if (!shipment || String(shipment.order_id) !== String(input.orderId)) throw new Error('SHIPMENT_ORDER_MISMATCH');
  const existing = (await tx.query<any>(`select * from trust_global_fulfillment_exceptions where shipment_id=$1 and exception_code=$2 and status<> 'RESOLVED' order by last_seen_at desc limit 1 for update`, [input.shipmentId,input.code])).rows[0];
  if (existing) {
    await tx.query(`update trust_global_fulfillment_exceptions set last_seen_at=coalesce($2,now()),metadata=jsonb_set(metadata,'{lastDescription}',to_jsonb($3::text),true) where id=$1`, [existing.id,input.occurredAt??null,input.description??'']);
    return { exceptionId:String(existing.id), replay:true, severity:String(existing.severity) as ExceptionSeverity, status:String(existing.status) as ExceptionStatus };
  }
  const row = (await tx.query<any>(`insert into trust_global_fulfillment_exceptions(order_id,orchestration_id,fulfillment_order_id,shipment_id,exception_code,status,severity,first_seen_at,last_seen_at,metadata) values($1,$2,$3,$4,$5,'OPEN',$6,coalesce($7,now()),coalesce($7,now()),jsonb_build_object('description',$8)) returning *`, [input.orderId,shipment.global_orchestration_id??null,shipment.fulfillment_order_id??null,input.shipmentId,input.code,severityFor[input.code],input.occurredAt??null,input.description??null])).rows[0];
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.fulfillment.exception.opened',$1,$2::jsonb) on conflict do nothing`, [input.orderId,JSON.stringify({orderId:input.orderId,shipmentId:input.shipmentId,exceptionId:row.id,code:input.code,severity:row.severity})]);
  return { exceptionId:String(row.id), replay:false, severity:String(row.severity) as ExceptionSeverity, status:'OPEN' as const };
}

export async function createRecoveryActionTx(tx: PoolClient, input: { exceptionId:string; orderId:string; shipmentId?:string|null; actionType:RecoveryActionType; idempotencyKey:string; maxAttempts?:number }) {
  const existing=(await tx.query<any>(`select * from trust_global_fulfillment_recovery_actions where idempotency_key=$1 for update`,[input.idempotencyKey])).rows[0];
  if(existing) return {actionId:String(existing.id),status:String(existing.status),replay:true,attemptCount:Number(existing.attempt_count)};
  const exception=(await tx.query<any>(`select id,status from trust_global_fulfillment_exceptions where id=$1 for update`,[input.exceptionId])).rows[0];
  if(!exception) throw new Error('FULFILLMENT_EXCEPTION_NOT_FOUND');
  if(['RESOLVED','ESCALATED'].includes(String(exception.status))) throw new Error('EXCEPTION_NOT_ACTIONABLE');
  const row=(await tx.query<any>(`insert into trust_global_fulfillment_recovery_actions(exception_id,order_id,shipment_id,action_type,idempotency_key,max_attempts) values($1,$2,$3,$4,$5,$6) returning *`,[input.exceptionId,input.orderId,input.shipmentId??null,input.actionType,input.idempotencyKey,input.maxAttempts??3])).rows[0];
  await tx.query(`update trust_global_fulfillment_exceptions set status='ACTION_REQUIRED',last_seen_at=now() where id=$1 and status in ('OPEN','INVESTIGATING')`,[input.exceptionId]);
  return {actionId:String(row.id),status:'PENDING' as const,replay:false,attemptCount:0};
}

export async function runRecoveryActionTx(tx: PoolClient, input:{actionId:string; success:boolean; error?:string|null}) {
  const row=(await tx.query<any>(`select * from trust_global_fulfillment_recovery_actions where id=$1 for update`,[input.actionId])).rows[0];
  if(!row) throw new Error('RECOVERY_ACTION_NOT_FOUND');
  if(['SUCCEEDED','CANCELLED'].includes(String(row.status))) return {actionId:String(row.id),status:String(row.status),replay:true,attemptCount:Number(row.attempt_count)};
  const nextAttempt=Number(row.attempt_count)+1;
  if(input.success){
    await tx.query(`update trust_global_fulfillment_recovery_actions set status='SUCCEEDED',attempt_count=$2,started_at=coalesce(started_at,now()),completed_at=now(),updated_at=now(),last_error=null where id=$1`,[row.id,nextAttempt]);
    await tx.query(`update trust_global_fulfillment_exceptions set status='RECOVERING',last_seen_at=now() where id=$1 and status not in ('RESOLVED','ESCALATED')`,[row.exception_id]);
    return {actionId:String(row.id),status:'SUCCEEDED' as const,replay:false,attemptCount:nextAttempt};
  }
  const exhausted=nextAttempt>=Number(row.max_attempts);
  await tx.query(`update trust_global_fulfillment_recovery_actions set status=$2,attempt_count=$3,started_at=coalesce(started_at,now()),completed_at=case when $2='FAILED' then now() else completed_at end,last_error=$4,updated_at=now() where id=$1`,[row.id,exhausted?'FAILED':'PENDING',nextAttempt,input.error??'RECOVERY_ACTION_FAILED']);
  if(exhausted) await tx.query(`update trust_global_fulfillment_exceptions set status='ESCALATED',last_seen_at=now() where id=$1 and status<>'RESOLVED'`,[row.exception_id]);
  return {actionId:String(row.id),status:(exhausted?'FAILED':'PENDING') as 'FAILED'|'PENDING',replay:false,attemptCount:nextAttempt,exhausted};
}

export async function resolveFulfillmentExceptionTx(tx:PoolClient,input:{exceptionId:string;resolutionCode:string}) {
  const row=(await tx.query<any>(`select * from trust_global_fulfillment_exceptions where id=$1 for update`,[input.exceptionId])).rows[0];
  if(!row) throw new Error('FULFILLMENT_EXCEPTION_NOT_FOUND');
  if(String(row.status)==='RESOLVED') return {exceptionId:String(row.id),replay:true,status:'RESOLVED' as const};
  await tx.query(`update trust_global_fulfillment_exceptions set status='RESOLVED',resolution_code=$2,resolved_at=coalesce(resolved_at,now()),last_seen_at=now() where id=$1`,[row.id,input.resolutionCode]);
  return {exceptionId:String(row.id),replay:false,status:'RESOLVED' as const};
}

export async function snapshotGlobalFulfillmentHealthTx(tx:PoolClient,orderId:string) {
  const agg=(await tx.query<any>(`select g.id orchestration_id,count(f.id)::int total,count(f.id) filter(where f.status='DELIVERED')::int delivered from trust_global_order_orchestrations g left join trust_marketplace_fulfillment_orders f on f.global_orchestration_id=g.id where g.order_id=$1 group by g.id`,[orderId])).rows[0];
  const ex=(await tx.query<any>(`select count(*) filter(where status<>'RESOLVED')::int open,count(*) filter(where status<>'RESOLVED' and severity='CRITICAL')::int critical,min(first_seen_at) filter(where status<>'RESOLVED') oldest from trust_global_fulfillment_exceptions where order_id=$1`,[orderId])).rows[0];
  const total=Number(agg?.total??0), delivered=Number(agg?.delivered??0), open=Number(ex?.open??0), critical=Number(ex?.critical??0);
  const progress=total?delivered/total:0;
  const health: 'GREEN'|'AMBER'|'RED'=critical>0?'RED':open>0?'AMBER':'GREEN';
  const row=(await tx.query<any>(`insert into trust_global_fulfillment_sla_snapshots(order_id,orchestration_id,total_fulfillment_orders,delivered_fulfillment_orders,open_exceptions,critical_exceptions,oldest_exception_at,delivery_progress,health) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(order_id,observed_at) do nothing returning *`,[orderId,agg?.orchestration_id??null,total,delivered,open,critical,ex.oldest??null,progress,health])).rows[0];
  return row ?? {order_id:orderId,total_fulfillment_orders:total,delivered_fulfillment_orders:delivered,open_exceptions:open,critical_exceptions:critical,delivery_progress:progress,health};
}

export async function getGlobalFulfillmentReliabilityTx(tx:PoolClient,orderId:string){
  const exceptions=(await tx.query<any>(`select * from trust_global_fulfillment_exceptions where order_id=$1 order by last_seen_at desc`,[orderId])).rows;
  const actions=(await tx.query<any>(`select * from trust_global_fulfillment_recovery_actions where order_id=$1 order by created_at desc`,[orderId])).rows;
  const latest=(await tx.query<any>(`select * from trust_global_fulfillment_sla_snapshots where order_id=$1 order by observed_at desc limit 1`,[orderId])).rows[0]??null;
  return {exceptions,actions,health:latest};
}
