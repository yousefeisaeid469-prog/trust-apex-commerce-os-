import type {PoolClient} from 'pg';
import {query,withPgTransaction} from '../db/postgres.ts';
import {assessLogisticsRisk,type ControlTowerShipment} from '../global-logistics-v308/contracts.ts';
import {planLogisticsRecovery,type RecoveryActionType} from './contracts.ts';
export const GLOBAL_LOGISTICS_RECOVERY_VERSION='V309.0.0';
const ACTIVE_SHIPMENT_STATUSES=['PLANNED','LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY'];

function rowToShipment(row:any,now:string):ControlTowerShipment{
  const input={shipmentStatus:String(row.shipment_status),etaAt:row.eta_at?new Date(row.eta_at).toISOString():null,lastEventAt:row.last_event_at?new Date(row.last_event_at).toISOString():null,executionStatus:row.execution_status?String(row.execution_status):null,executionAttempts:Number(row.execution_attempts??0),lastExecutionError:row.last_execution_error??null,openExceptions:Number(row.open_exceptions??0),criticalExceptions:Number(row.critical_exceptions??0),now};
  return {shipmentId:String(row.shipment_id),orderId:String(row.order_id),carrierCode:String(row.carrier_code),trackingNumber:row.tracking_number?String(row.tracking_number):null,shipmentStatus:input.shipmentStatus,etaAt:input.etaAt,lastEventAt:input.lastEventAt,executionStatus:input.executionStatus,executionAttempts:input.executionAttempts,lastExecutionError:input.lastExecutionError,openExceptions:input.openExceptions,criticalExceptions:input.criticalExceptions,assessment:assessLogisticsRisk(input)};
}
async function loadCandidates(orderId:string|undefined,now:string){
  const params=orderId?[orderId]:[]; const filter=orderId?'s.order_id=$1 and':'true and';
  const rows=(await query<any>(`select s.id shipment_id,s.order_id,s.carrier carrier_code,s.tracking_number,s.status shipment_status,s.eta_at,s.last_carrier_event_at last_event_at,
    ex.status execution_status,coalesce(ex.attempts,0) execution_attempts,ex.last_error last_execution_error,
    coalesce(x.open_exceptions,0) open_exceptions,coalesce(x.critical_exceptions,0) critical_exceptions
    from trust_shipments s
    left join lateral (select e.status,e.attempts,e.last_error from trust_global_logistics_executions e where e.shipment_id=s.id order by e.created_at desc limit 1) ex on true
    left join lateral (select count(*) filter(where e.status<>'RESOLVED')::int open_exceptions,count(*) filter(where e.status<>'RESOLVED' and e.severity='CRITICAL')::int critical_exceptions from trust_global_fulfillment_exceptions e where e.shipment_id=s.id) x on true
    where ${filter} s.status=any($${params.length+1}) order by s.updated_at desc`,[...params,ACTIVE_SHIPMENT_STATUSES])).rows;
  return rows.map(r=>rowToShipment(r,now));
}

export async function previewGlobalLogisticsRecovery(orderId:string,now=new Date().toISOString()){
  const shipments=await loadCandidates(orderId,now);
  const plans=shipments.map(s=>{const p=planLogisticsRecovery({shipmentId:s.shipmentId,orderId:s.orderId,riskBand:s.assessment.riskBand,riskScore:s.assessment.riskScore,riskReasons:s.assessment.riskReasons,recommendedAction:s.assessment.recommendedAction as RecoveryActionType,executionStatus:s.executionStatus,criticalExceptions:s.criticalExceptions});return {...s,plan:p};}).filter(x=>x.plan.actionType!=='NO_ACTION');
  return {version:GLOBAL_LOGISTICS_RECOVERY_VERSION,orderId,generatedAt:now,candidates:plans};
}

export async function createRecoveryPlansTx(tx:PoolClient,orderId:string,now=new Date().toISOString()){
  const rows=(await tx.query<any>(`select s.id shipment_id,s.order_id,s.carrier carrier_code,s.tracking_number,s.status shipment_status,s.eta_at,s.last_carrier_event_at last_event_at,
    ex.status execution_status,coalesce(ex.attempts,0) execution_attempts,ex.last_error last_execution_error,
    coalesce(x.open_exceptions,0) open_exceptions,coalesce(x.critical_exceptions,0) critical_exceptions,
    snap.id snapshot_id
    from trust_shipments s
    left join lateral (select e.status,e.attempts,e.last_error from trust_global_logistics_executions e where e.shipment_id=s.id order by e.created_at desc limit 1) ex on true
    left join lateral (select count(*) filter(where e.status<>'RESOLVED')::int open_exceptions,count(*) filter(where e.status<>'RESOLVED' and e.severity='CRITICAL')::int critical_exceptions from trust_global_fulfillment_exceptions e where e.shipment_id=s.id) x on true
    left join lateral (select id from trust_global_logistics_control_tower_snapshots z where z.shipment_id=s.id order by z.snapshot_at desc limit 1) snap on true
    where s.order_id=$1 and s.status=any($2) for update`,[orderId,ACTIVE_SHIPMENT_STATUSES])).rows;
  const created=[];
  for(const row of rows){
    const s=rowToShipment(row,now); const p=planLogisticsRecovery({shipmentId:s.shipmentId,orderId:s.orderId,riskBand:s.assessment.riskBand,riskScore:s.assessment.riskScore,riskReasons:s.assessment.riskReasons,recommendedAction:s.assessment.recommendedAction as RecoveryActionType,executionStatus:s.executionStatus,criticalExceptions:s.criticalExceptions});
    if(p.actionType==='NO_ACTION') continue;
    const key=`${orderId}:${s.shipmentId}:${p.actionType}:${s.assessment.riskScore}:${s.assessment.riskReasons.join(',')}`;
    const existing=(await tx.query<any>(`select id,status from trust_global_logistics_recovery_plans where idempotency_key=$1`,[key])).rows[0];
    if(existing){created.push({planId:String(existing.id),status:String(existing.status),replay:true,actionType:p.actionType});continue;}
    const plan=(await tx.query<any>(`insert into trust_global_logistics_recovery_plans(order_id,shipment_id,control_tower_snapshot_id,status,risk_band,risk_score,priority,reason_codes,idempotency_key) values($1,$2,$3,'PLANNED',$4,$5,$6,$7::jsonb,$8) returning id`,[orderId,s.shipmentId,row.snapshot_id??null,s.assessment.riskBand,s.assessment.riskScore,p.priority,JSON.stringify(p.reasonCodes),key])).rows[0];
    const actionKey=`${key}:action`;
    const action=(await tx.query<any>(`insert into trust_global_logistics_recovery_actions(plan_id,order_id,shipment_id,action_type,idempotency_key) values($1,$2,$3,$4,$5) returning id,status`,[plan.id,orderId,s.shipmentId,p.actionType,actionKey])).rows[0];
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.logistics.recovery.plan.created',$1,$2::jsonb)`,[orderId,JSON.stringify({version:GLOBAL_LOGISTICS_RECOVERY_VERSION,planId:plan.id,actionId:action.id,shipmentId:s.shipmentId,actionType:p.actionType,priority:p.priority})]);
    created.push({planId:String(plan.id),actionId:String(action.id),status:String(action.status),replay:false,actionType:p.actionType,priority:p.priority});
  }
  return {version:GLOBAL_LOGISTICS_RECOVERY_VERSION,orderId,created};
}
export async function createRecoveryPlans(orderId:string){return withPgTransaction(tx=>createRecoveryPlansTx(tx,orderId));}

async function claimActions(limit:number){return query<any>(`update trust_global_logistics_recovery_actions a set status='PROCESSING',lease_until=now()+interval '2 minutes',attempt_count=a.attempt_count+1,updated_at=now() where a.id in (select id from trust_global_logistics_recovery_actions where status='QUEUED' and available_at<=now() and (lease_until is null or lease_until<now()) order by available_at,created_at for update skip locked limit $1) returning *`,[limit]);}
async function finish(tx:PoolClient,id:string,status:string,result:any,error?:string){await tx.query(`update trust_global_logistics_recovery_actions set status=$2,lease_until=null,last_error=$3,result=$4::jsonb,completed_at=case when $2 in ('SUCCEEDED','FAILED','SKIPPED','CANCELLED') then now() else completed_at end,updated_at=now() where id=$1`,[id,status,error??null,JSON.stringify(result)]);}

export async function runGlobalLogisticsRecoveryWorker(limit=20){
  const jobs=(await claimActions(Math.max(1,Math.min(100,limit)))).rows as any[]; const results:any[]=[];
  for(const job of jobs){
    try{
      const result=await withPgTransaction(async tx=>{
        const action=String(job.action_type) as RecoveryActionType;
        if(action==='NO_ACTION'){await finish(tx,job.id,'SKIPPED',{reason:'NO_ACTION'});return {actionId:String(job.id),status:'SKIPPED',action};}
        if(action==='RETRY_LOGISTICS_EXECUTION'){
          const source=(await tx.query<any>(`select e.*,d.priority,d.destination_country,d.currency,d.requested_mode from trust_global_logistics_executions e join trust_global_logistics_decisions d on d.id=e.decision_id where e.shipment_id=$1 order by e.created_at desc limit 1`,[job.shipment_id])).rows[0];
          if(!source) throw new Error('LOGISTICS_DECISION_NOT_FOUND');
          const key=`recovery:${job.id}:execution`;
          const existing=(await tx.query<any>(`select id,status from trust_global_logistics_executions where idempotency_key=$1`,[key])).rows[0];
          const execution=existing??(await tx.query<any>(`insert into trust_global_logistics_executions(decision_id,order_id,shipment_id,carrier_code,service_code,status,idempotency_key) values($1,$2,$3,$4,$5,'QUEUED',$6) returning id,status`,[source.decision_id,source.order_id,source.shipment_id,source.carrier_code,source.service_code,key])).rows[0];
          await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.logistics.recovery.execution.retry.queued',$1,$2::jsonb)`,[job.shipment_id,JSON.stringify({recoveryActionId:job.id,executionId:execution.id,carrier:source.carrier_code,service:source.service_code})]);
          await finish(tx,job.id,'SUCCEEDED',{executionId:String(execution.id),replay:Boolean(existing)}); await tx.query(`update trust_global_logistics_recovery_plans set status='SUCCEEDED',updated_at=now(),completed_at=now() where id=$1`,[job.plan_id]);
          return {actionId:String(job.id),status:'SUCCEEDED',action,executionId:String(execution.id),replay:Boolean(existing)};
        }
        const eventType=action==='REQUEST_CARRIER_REFRESH'?'global.logistics.recovery.carrier.refresh.requested':action==='REVIEW_CUSTOMER_PROMISE'?'global.logistics.recovery.customer.promise.review': 'global.logistics.recovery.critical.escalation';
        await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`,[eventType,job.shipment_id,JSON.stringify({recoveryActionId:job.id,planId:job.plan_id,orderId:job.order_id,shipmentId:job.shipment_id,actionType:action})]);
        await finish(tx,job.id,'SUCCEEDED',{eventType,dispatched:true});
        await tx.query(`update trust_global_logistics_recovery_plans set status='SUCCEEDED',updated_at=now(),completed_at=now() where id=$1`,[job.plan_id]);
        return {actionId:String(job.id),status:'SUCCEEDED',action,eventType};
      }); results.push(result);
    }catch(error){
      const message=error instanceof Error?error.message:'GLOBAL_LOGISTICS_RECOVERY_FAILED';
      await withPgTransaction(async tx=>{const terminal=Number(job.attempt_count)>=Number(job.max_attempts);await finish(tx,job.id,terminal?'FAILED':'QUEUED',{terminal},message);if(terminal)await tx.query(`update trust_global_logistics_recovery_plans set status='FAILED',updated_at=now(),completed_at=now() where id=$1`,[job.plan_id]);});
      results.push({actionId:String(job.id),status:Number(job.attempt_count)>=Number(job.max_attempts)?'FAILED':'QUEUED',error:message,attempts:Number(job.attempt_count)});
    }
  }
  return {version:GLOBAL_LOGISTICS_RECOVERY_VERSION,claimed:jobs.length,results};
}

export async function getGlobalLogisticsRecovery(orderId:string){
  const plans=(await query(`select * from trust_global_logistics_recovery_plans where order_id=$1 order by priority desc,created_at desc`,[orderId])).rows;
  const actions=(await query(`select * from trust_global_logistics_recovery_actions where order_id=$1 order by created_at desc`,[orderId])).rows;
  return {version:GLOBAL_LOGISTICS_RECOVERY_VERSION,orderId,plans,actions};
}
