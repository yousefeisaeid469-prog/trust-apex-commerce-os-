import {query,withPgTransaction,databaseConfigured} from '../db/postgres.ts';
import {appendEventTx} from '../durable-events/tx.ts';
import {AutonomousCommerceOrchestrator} from './index.ts';
export async function acceptDurableOrchestration(event:any){
 if(event?.adapter && typeof event.adapter==='function') throw new Error('DURABLE_ORCHESTRATOR_ADAPTER_MUST_BE_PROVIDER_REGISTERED');
 if(!event?.eventId||!event?.tenantId||!event?.aggregateId||!event?.type)throw new Error('EVENT_IDENTITY_REQUIRED');
 const key=String(event.idempotencyKey??event.eventId);
 if(!databaseConfigured())throw new Error('DATABASE_NOT_CONFIGURED');
 return withPgTransaction(async tx=>{
  const existing=await tx.query<any>('select * from trust_autonomous_orchestration_runs where idempotency_key=$1 for update',[key]);
  if(existing.rows[0])return {...existing.rows[0],replay:true};
  const row=(await tx.query<any>(`insert into trust_autonomous_orchestration_runs(tenant_id,event_id,aggregate_id,event_type,sequence,idempotency_key,status,payload) values($1,$2,$3,$4,$5,$6,'ACCEPTED',$7::jsonb) returning *`,[event.tenantId,event.eventId,event.aggregateId,event.type,Number(event.sequence??0),key,JSON.stringify(event.payload??{})])).rows[0];
  try{
   await appendEventTx(tx,{tenantId:String(event.tenantId),eventType:String(event.type),aggregateId:String(event.aggregateId),idempotencyKey:key,payload:event.payload??{},correlationId:event.correlationId??null,causationId:event.causationId??null,schemaVersion:Number(event.schemaVersion??1)});
   const orchestrator=new AutonomousCommerceOrchestrator();
   const runtime=await orchestrator.ingest(event,{tenantId:event.tenantId,enabled:false});
   const updated=(await tx.query<any>(`update trust_autonomous_orchestration_runs set status='PROCESSED',result=$2::jsonb,updated_at=now() where id=$1 returning *`,[row.id,JSON.stringify(runtime)])).rows[0];
   return {...updated,replay:false};
  }catch(error){await tx.query(`update trust_autonomous_orchestration_runs set status='FAILED',last_error=$2,updated_at=now() where id=$1`,[row.id,error instanceof Error?error.message:String(error)]);throw error;}
 });
}
export async function getDurableOrchestration(idempotencyKey:string){const r=await query<any>('select * from trust_autonomous_orchestration_runs where idempotency_key=$1',[idempotencyKey]);return r.rows[0]??null;}
