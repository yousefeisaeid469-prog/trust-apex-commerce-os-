import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureOrderRuntimeOperationTx, transitionRuntimeOperationTx } from '../../platform/runtime-spine';

export type RecoveryBoundary = 'PAYMENT'|'INVENTORY'|'FULFILLMENT'|'DELIVERY'|'SETTLEMENT'|'RUNTIME'|'UNKNOWN';

function classifyFailure(code:string): RecoveryBoundary {
  const c=String(code||'').toUpperCase();
  if(c.includes('PAYMENT') || c.includes('CAPTURE')) return 'PAYMENT';
  if(c.includes('INVENTORY') || c.includes('RESERVATION') || c.includes('STOCK')) return 'INVENTORY';
  if(c.includes('FULFILLMENT')) return 'FULFILLMENT';
  if(c.includes('DELIVERY') || c.includes('SHIPMENT')) return 'DELIVERY';
  if(c.includes('SETTLEMENT') || c.includes('PAYOUT')) return 'SETTLEMENT';
  if(c.includes('RUNTIME') || c.includes('WORKER') || c.includes('LEASE')) return 'RUNTIME';
  return 'UNKNOWN';
}

export async function recordCommerceFailureTx(tx:SqlExecutor,input:{orderId:string;executionRunId?:string|null;jobId?:string|null;failureCode:string;errorMessage?:string|null;attempt?:number;dead?:boolean;metadata?:Record<string,unknown>}) {
  const boundary=classifyFailure(input.failureCode);
  const severity=input.dead ? 'ESCALATED' : (boundary==='UNKNOWN' ? 'BLOCKED' : 'RECOVERABLE');
  const runtime=await ensureOrderRuntimeOperationTx(tx,input.orderId,{metadata:{source:'v409.failure-closure',boundary,failureCode:input.failureCode}});
  const targetStatus=input.dead ? 'DEAD' : 'FAILED';
  const current=runtime.status;
  if(current!==targetStatus && !['SUCCEEDED','CANCELLED'].includes(current)) {
    await transitionRuntimeOperationTx(tx,runtime.operationId,targetStatus,{eventType:input.dead?'recovery.dead':'recovery.failed',errorCode:input.failureCode,errorMessage:input.errorMessage??null,attempt:input.attempt??0,payload:{boundary,orderId:input.orderId}});
  }
  const existing=(await tx.query<any>(`select * from trust_commerce_recovery_cases where order_id=$1 and status in ('OPEN','CLAIMED','ESCALATED') order by updated_at desc,id desc limit 1 for update`,[input.orderId])).rows[0];
  let row:any;
  if(existing){
    row=(await tx.query<any>(`update trust_commerce_recovery_cases set execution_run_id=coalesce($2,execution_run_id),runtime_operation_id=$3,job_id=coalesce($4,job_id),boundary=$5,failure_code=$6,severity=$7,status=case when $7='ESCALATED' then 'ESCALATED' else status end,attempt_count=greatest(attempt_count,$8),last_seen_at=now(),last_error_message=$9,metadata_json=metadata_json || $10::jsonb,updated_at=now() where id=$1 returning *`,[existing.id,input.executionRunId??null,runtime.operationId,input.jobId??null,boundary,input.failureCode,severity,input.attempt??0,input.errorMessage??null,JSON.stringify(input.metadata??{})])).rows[0];
  } else {
    row=(await tx.query<any>(`insert into trust_commerce_recovery_cases(order_id,execution_run_id,runtime_operation_id,job_id,boundary,failure_code,severity,status,attempt_count,last_error_message,metadata_json) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) returning *`,[input.orderId,input.executionRunId??null,runtime.operationId,input.jobId??null,boundary,input.failureCode,severity,input.dead?'ESCALATED':'OPEN',input.attempt??0,input.errorMessage??null,JSON.stringify(input.metadata??{})])).rows[0];
  }
  const nextAttempt=Number(row.attempt_count||0)+1;
  await tx.query(`update trust_commerce_recovery_cases set attempt_count=$2,updated_at=now() where id=$1`,[row.id,nextAttempt]);
  await tx.query(`insert into trust_commerce_recovery_attempts(recovery_case_id,job_id,attempt_number,action,outcome,error_code,result_json) values($1,$2,$3,$4,$5,$6,$7::jsonb) on conflict(recovery_case_id,attempt_number) do update set outcome=excluded.outcome,error_code=excluded.error_code,result_json=excluded.result_json`,[row.id,input.jobId??null,nextAttempt,input.dead?'ESCALATE':'RETRY',input.dead?'ESCALATED':'FAILED',input.failureCode,JSON.stringify({boundary,severity,attempt:input.attempt??0})]);
  return {recoveryCaseId:String(row.id),boundary,severity,status:input.dead?'ESCALATED':'OPEN',runtimeOperationId:runtime.operationId};
}

export async function resolveCommerceRecoveryTx(tx:SqlExecutor,input:{orderId:string;jobId?:string|null;result?:Record<string,unknown>}) {
  const row=(await tx.query<any>(`select id,runtime_operation_id,attempt_count from trust_commerce_recovery_cases where order_id=$1 and status in ('OPEN','CLAIMED','ESCALATED') order by updated_at desc,id desc limit 1 for update`,[input.orderId])).rows[0];
  if(!row) return {resolved:false};
  await tx.query(`update trust_commerce_recovery_cases set status='RESOLVED',resolved_at=coalesce(resolved_at,now()),last_seen_at=now(),updated_at=now() where id=$1`,[row.id]);
  await tx.query(`insert into trust_commerce_recovery_attempts(recovery_case_id,job_id,attempt_number,action,outcome,result_json) values($1,$2,$3,'RESOLVE','SUCCEEDED',$4::jsonb) on conflict(recovery_case_id,attempt_number) do nothing`,[row.id,input.jobId??null,Number(row.attempt_count)+1,JSON.stringify(input.result??{})]);
  if(row.runtime_operation_id){
    const runtime=(await tx.query<any>(`select status from trust_runtime_operations where id=$1 for update`,[row.runtime_operation_id])).rows[0];
    if(runtime && ['FAILED','DEAD'].includes(String(runtime.status))) await transitionRuntimeOperationTx(tx,String(row.runtime_operation_id),'RUNNING',{eventType:'recovery.resumed',payload:{orderId:input.orderId,recoveryCaseId:String(row.id)}});
  }
  return {resolved:true,recoveryCaseId:String(row.id)};
}

export async function recoverySnapshot(db:SqlExecutor,input:{status?:string;boundary?:string;limit?:number}={}) {
  const params:any[]=[]; const where:string[]=[];
  if(input.status){params.push(input.status);where.push(`status=$${params.length}`);}
  if(input.boundary){params.push(input.boundary);where.push(`boundary=$${params.length}`);}
  params.push(Math.min(Math.max(Number(input.limit??50),1),200));
  const rows=await db.query(`select * from trust_commerce_recovery_snapshot${where.length?` where ${where.join(' and ')}`:''} order by last_seen_at desc limit $${params.length}`,params);
  return rows.rows;
}
