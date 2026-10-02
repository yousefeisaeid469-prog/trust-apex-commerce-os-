import { databaseConfigured, withPgTransaction } from '../db/postgres.ts';
import { appendEventTx } from '../durable-events/tx.ts';
import { AutonomousCommerceOrchestrator } from './index.ts';

export async function completeOrchestration(runId:string,result:unknown){
  if(!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
  return withPgTransaction(async tx=>{
    const r=await tx.query<any>(`update trust_autonomous_orchestration_runs set status='PROCESSED',result=$2::jsonb,last_error=null,updated_at=now() where id=$1 returning *`,[runId,JSON.stringify(result)]);
    if(!r.rows[0]) throw new Error('ORCHESTRATION_RUN_NOT_FOUND');
    return r.rows[0];
  });
}

export async function consumeAutonomousOrchestration(event:any){
  if(!event?.eventId||!event?.tenantId||!event?.aggregateId||!event?.type) throw new Error('EVENT_IDENTITY_REQUIRED');
  if(!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
  return withPgTransaction(async tx=>{
    const key=String(event.idempotencyKey??event.eventId);
    const existing=await tx.query<any>(`select * from trust_autonomous_orchestration_runs where idempotency_key=$1 for update`,[key]);
    if(existing.rows[0]?.status==='PROCESSED') return {...existing.rows[0],replay:true};
    const row=existing.rows[0] ?? (await tx.query<any>(`insert into trust_autonomous_orchestration_runs(tenant_id,event_id,aggregate_id,event_type,sequence,idempotency_key,status,payload) values($1,$2,$3,$4,$5,$6,'ACCEPTED',$7::jsonb) returning *`,[event.tenantId,event.eventId,event.aggregateId,event.type,Number(event.sequence??0),key,JSON.stringify(event.payload??{})])).rows[0];
    await appendEventTx(tx,{tenantId:String(event.tenantId),eventType:String(event.type),aggregateId:String(event.aggregateId),idempotencyKey:key,payload:event.payload??{},schemaVersion:Number(event.schemaVersion??1)});
    try{
      const result=await new AutonomousCommerceOrchestrator().ingest(event,{tenantId:event.tenantId,enabled:false});
      return await completeOrchestrationInTx(tx,String(row.id),result);
    }catch(error){
      await tx.query(`update trust_autonomous_orchestration_runs set status='FAILED',last_error=$2,updated_at=now() where id=$1`,[row.id,error instanceof Error?error.message:String(error)]);
      throw error;
    }
  });
}

async function completeOrchestrationInTx(tx:any,runId:string,result:unknown){
  const r=await tx.query<any>(`update trust_autonomous_orchestration_runs set status='PROCESSED',result=$2::jsonb,last_error=null,updated_at=now() where id=$1 returning *`,[runId,JSON.stringify(result)]);
  if(!r.rows[0]) throw new Error('ORCHESTRATION_RUN_NOT_FOUND');
  return {...r.rows[0],replay:false};
}
