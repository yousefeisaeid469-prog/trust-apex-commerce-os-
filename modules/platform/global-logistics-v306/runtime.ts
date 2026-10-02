import type { PoolClient } from 'pg';
import { query,withPgTransaction } from '../db/postgres.ts';
import { chooseLogisticsTx } from '../global-logistics-v305/runtime.ts';
import { getCarrier } from '../global-carrier-v304/registry.ts';
import { getFulfillmentProvider } from '../fulfillment-providers/registry.ts';
import { createSandboxLabel } from './sandbox.ts';
import type { LogisticsExecutionInput,LogisticsExecutionResult } from './contracts.ts';

export const GLOBAL_LOGISTICS_EXECUTION_VERSION='V306.0.0';

function clean(v:string){return v.trim().toUpperCase();}
function createLabel(carrier:string,input:{shipmentId:string;orderId:string;service:string;destination:unknown}){
  if(clean(carrier)==='TRUST-E2E') return Promise.resolve(createSandboxLabel(input));
  return getFulfillmentProvider(carrier).createLabel(input);
}

export async function queueGlobalLogisticsExecutionTx(tx:PoolClient,input:LogisticsExecutionInput){
  if(!input.orderId.trim()||!input.shipmentId.trim()) throw new Error('ORDER_AND_SHIPMENT_REQUIRED');
  if(!input.executionIdempotencyKey.trim()) throw new Error('EXECUTION_IDEMPOTENCY_KEY_REQUIRED');
  const prior=(await tx.query<any>(`select * from trust_global_logistics_executions where idempotency_key=$1 for update`,[input.executionIdempotencyKey])).rows[0];
  if(prior) return {replay:true,execution:prior};
  const shipment=(await tx.query<any>(`select id,order_id,carrier,service,destination,status from trust_shipments where id=$1 and order_id=$2 for update`,[input.shipmentId,input.orderId])).rows[0];
  if(!shipment) throw new Error('SHIPMENT_NOT_FOUND');
  if(!['PLANNED','LABEL_CREATED'].includes(String(shipment.status))) throw new Error(`LOGISTICS_EXECUTION_NOT_ALLOWED:${shipment.status}`);
  const decision=await chooseLogisticsTx(tx,{orderId:input.orderId,shipmentId:input.shipmentId,country:input.country,currency:input.currency,mode:input.mode,priority:input.priority,decisionIdempotencyKey:input.decisionIdempotencyKey});
  const d:any=decision.decision;
  const carrier=clean(String(d.selected_carrier));
  getCarrier(carrier);
  const row=(await tx.query<any>(`insert into trust_global_logistics_executions(decision_id,order_id,shipment_id,carrier_code,service_code,status,idempotency_key) values($1,$2,$3,$4,$5,'QUEUED',$6) returning *`,[d.id,input.orderId,input.shipmentId,carrier,String(d.selected_service),input.executionIdempotencyKey.trim()])).rows[0];
  await tx.query(`update trust_shipments set carrier=$2,service=$3,updated_at=now() where id=$1 and status='PLANNED'`,[input.shipmentId,carrier,String(d.selected_service)]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.logistics.execution.queued',$1,$2::jsonb)`,[input.shipmentId,JSON.stringify({executionId:row.id,decisionId:d.id,carrier,service:d.selected_service})]);
  return {replay:false,execution:row,decision:d};
}

export async function queueGlobalLogisticsExecution(input:LogisticsExecutionInput){return withPgTransaction(tx=>queueGlobalLogisticsExecutionTx(tx,input));}

export async function claimGlobalLogisticsExecutions(limit=25){
  if(!Number.isInteger(limit)||limit<1||limit>100) throw new Error('INVALID_LIMIT');
  return query(`with candidates as (select id from trust_global_logistics_executions where status in ('QUEUED','PROCESSING','FAILED') and available_at<=now() and (lease_until is null or lease_until<now()) and attempts<6 order by available_at asc,created_at asc for update skip locked limit $1) update trust_global_logistics_executions e set status='PROCESSING',lease_until=now()+interval '2 minutes',attempts=e.attempts+1,started_at=coalesce(e.started_at,now()),updated_at=now() from candidates c where e.id=c.id returning e.id,e.order_id,e.shipment_id,e.carrier_code,e.service_code,e.attempts,e.status,e.lease_until`,[limit]);
}

export async function runGlobalLogisticsExecution(limit=25){
  const jobs=(await claimGlobalLogisticsExecutions(limit)).rows as Array<any>;
  const results:unknown[]=[];
  for(const job of jobs){
    const attempt=Number(job.attempts);
    try{
      const shipment=(await query<any>(`select id,order_id,carrier,service,destination,status,tracking_number,provider_reference from trust_shipments where id=$1`,[job.shipment_id])).rows[0];
      if(!shipment) throw new Error('SHIPMENT_NOT_FOUND');
      if(shipment.tracking_number){
        await withPgTransaction(async tx=>{
          await tx.query(`insert into trust_global_logistics_execution_attempts(execution_id,attempt_no,outcome,tracking_number,provider_reference,metadata) values($1,$2,'SKIPPED',$3,$4,$5::jsonb) on conflict(execution_id,attempt_no) do nothing`,[job.id,attempt,shipment.tracking_number,shipment.provider_reference,JSON.stringify({reason:'TRACKING_ALREADY_PRESENT'})]);
          await tx.query(`update trust_global_logistics_executions set status='LABEL_CREATED',tracking_number=$2,provider_reference=$3,lease_until=null,completed_at=coalesce(completed_at,now()),updated_at=now() where id=$1`,[job.id,shipment.tracking_number,shipment.provider_reference]);
        });
        results.push({ok:true,executionId:job.id,status:'LABEL_CREATED',trackingNumber:shipment.tracking_number,replay:true});
        continue;
      }
      const label=await createLabel(job.carrier_code,{shipmentId:shipment.id,orderId:shipment.order_id,service:job.service_code,destination:shipment.destination});
      await withPgTransaction(async tx=>{
        await tx.query(`update trust_shipments set tracking_number=$2,provider_reference=$3,status='LABEL_CREATED',updated_at=now() where id=$1 and status in ('PLANNED','LABEL_CREATED')`,[shipment.id,label.trackingNumber,label.providerReference??null]);
        await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','LABEL_CREATED',now(),$3) on conflict(id) do nothing`,[`${shipment.id}:V306:LABEL_CREATED`,shipment.id,`Global logistics execution via ${job.carrier_code}`]);
        await tx.query(`insert into trust_global_logistics_execution_attempts(execution_id,attempt_no,outcome,tracking_number,provider_reference,metadata) values($1,$2,'LABEL_CREATED',$3,$4,$5::jsonb) on conflict(execution_id,attempt_no) do nothing`,[job.id,attempt,label.trackingNumber,label.providerReference??null,JSON.stringify({carrier:job.carrier_code,service:job.service_code})]);
        await tx.query(`update trust_global_logistics_executions set status='LABEL_CREATED',tracking_number=$2,provider_reference=$3,lease_until=null,completed_at=now(),last_error=null,updated_at=now() where id=$1`,[job.id,label.trackingNumber,label.providerReference??null]);
        await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('fulfillment.logistics.label.created',$1,$2::jsonb)`,[shipment.id,JSON.stringify({executionId:job.id,carrier:job.carrier_code,service:job.service_code,trackingNumber:label.trackingNumber,providerReference:label.providerReference??null})]);
      });
      results.push({ok:true,executionId:job.id,status:'LABEL_CREATED',trackingNumber:label.trackingNumber,providerReference:label.providerReference});
    }catch(error){
      const reason=error instanceof Error?error.message:'GLOBAL_LOGISTICS_EXECUTION_FAILED';
      const terminal=attempt>=6;
      await withPgTransaction(async tx=>{
        await tx.query(`insert into trust_global_logistics_execution_attempts(execution_id,attempt_no,outcome,error_code,metadata) values($1,$2,'FAILED',$3,$4::jsonb) on conflict(execution_id,attempt_no) do nothing`,[job.id,attempt,reason,JSON.stringify({carrier:job.carrier_code,service:job.service_code,terminal})]);
        await tx.query(`update trust_global_logistics_executions set status=$2,lease_until=null,last_error=$3,available_at=case when $2='FAILED' then now()+interval '15 minutes' else now()+interval '30 seconds' end,updated_at=now() where id=$1`,[job.id,terminal?'FAILED':'QUEUED',reason]);
      });
      results.push({ok:false,executionId:job.id,status:terminal?'FAILED':'QUEUED',error:reason,attempts:attempt,terminal});
    }
  }
  return results;
}

export async function getGlobalLogisticsExecution(orderId:string){
  return (await query(`select e.*,d.priority,d.destination_country,d.currency,d.requested_mode from trust_global_logistics_executions e join trust_global_logistics_decisions d on d.id=e.decision_id where e.order_id=$1 order by e.created_at desc`,[orderId])).rows;
}
