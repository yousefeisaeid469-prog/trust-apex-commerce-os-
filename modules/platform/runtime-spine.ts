import type { PoolClient } from 'pg';
import { query } from './db/postgres.ts';

export type RuntimeOperationStatus = 'ACCEPTED'|'RUNNING'|'WAITING'|'SUCCEEDED'|'FAILED'|'DEAD'|'CANCELLED';

type OperationInput = {
  tenantId?: string;
  operationType: string;
  operationKey: string;
  aggregateType?: string;
  aggregateId?: string;
  commandId?: string;
  workflowId?: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
};

const RUNTIME_STATUS_TRANSITIONS: Record<RuntimeOperationStatus, RuntimeOperationStatus[]> = {
  ACCEPTED: ['RUNNING','WAITING','FAILED','DEAD','CANCELLED'],
  RUNNING: ['RUNNING','WAITING','SUCCEEDED','FAILED','DEAD','CANCELLED'],
  WAITING: ['RUNNING','WAITING','SUCCEEDED','FAILED','DEAD','CANCELLED'],
  SUCCEEDED: ['SUCCEEDED'],
  FAILED: ['RUNNING','WAITING','FAILED','DEAD','CANCELLED'],
  DEAD: ['RUNNING','DEAD','CANCELLED'],
  CANCELLED: ['CANCELLED'],
};

const assertStatus = (status: string): asserts status is RuntimeOperationStatus => {
  if (!['ACCEPTED','RUNNING','WAITING','SUCCEEDED','FAILED','DEAD','CANCELLED'].includes(status)) throw new Error(`RUNTIME_STATUS_INVALID:${status}`);
};

export async function ensureRuntimeOperationTx(tx: PoolClient, input: OperationInput) {
  if (!input.operationType || !input.operationKey) throw new Error('RUNTIME_OPERATION_IDENTITY_REQUIRED');
  const tenantId = input.tenantId ?? 'default';
  const existing = await tx.query<any>(`SELECT id,status FROM trust_runtime_operations WHERE tenant_id=$1 AND operation_type=$2 AND operation_key=$3 FOR UPDATE`,[tenantId,input.operationType,input.operationKey]);
  if (existing.rows[0]) return { operationId:String(existing.rows[0].id), replay:true, status:String(existing.rows[0].status) as RuntimeOperationStatus };
  const row = await tx.query<any>(`INSERT INTO trust_runtime_operations(tenant_id,operation_type,operation_key,aggregate_type,aggregate_id,command_id,workflow_id,correlation_id,causation_id,metadata_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING id,status`,[
    tenantId,input.operationType,input.operationKey,input.aggregateType??null,input.aggregateId??null,input.commandId??null,input.workflowId??null,input.correlationId??null,input.causationId??null,JSON.stringify(input.metadata??{})
  ]);
  const operationId=String(row.rows[0].id);
  await tx.query(`INSERT INTO trust_runtime_operation_events(operation_id,event_type,from_status,to_status,attempt,payload_json) VALUES($1,'operation.accepted',NULL,'ACCEPTED',0,$2::jsonb)`,[operationId,JSON.stringify(input.metadata??{})]);
  return { operationId,replay:false,status:'ACCEPTED' as const };
}

export async function transitionRuntimeOperationTx(tx: PoolClient, operationId:string, status:RuntimeOperationStatus, input:{eventType?:string;errorCode?:string|null;errorMessage?:string|null;attempt?:number;payload?:Record<string,unknown>}={}) {
  assertStatus(status);
  const current=(await tx.query<any>(`SELECT id,status,attempt_count AS "attemptCount" FROM trust_runtime_operations WHERE id=$1 FOR UPDATE`,[operationId])).rows[0];
  if(!current) throw new Error('RUNTIME_OPERATION_NOT_FOUND');
  const from=String(current.status) as RuntimeOperationStatus;
  const attempt=input.attempt??Number(current.attemptCount??0);
  if (!RUNTIME_STATUS_TRANSITIONS[from]?.includes(status)) {
    throw new Error(`RUNTIME_STATUS_TRANSITION_INVALID:${from}->${status}`);
  }
  const terminal=['SUCCEEDED','FAILED','DEAD','CANCELLED'].includes(status);
  await tx.query(`UPDATE trust_runtime_operations SET status=$2,attempt_count=$3,last_error_code=$4,last_error_message=$5,started_at=CASE WHEN $2='RUNNING' THEN COALESCE(started_at,now()) ELSE started_at END,heartbeat_at=CASE WHEN $2='RUNNING' THEN now() ELSE heartbeat_at END,finished_at=CASE WHEN $2 IN ('SUCCEEDED','FAILED','DEAD','CANCELLED') THEN COALESCE(finished_at,now()) ELSE finished_at END,updated_at=now() WHERE id=$1`,[operationId,status,attempt,input.errorCode??null,input.errorMessage??null]);
  await tx.query(`INSERT INTO trust_runtime_operation_events(operation_id,event_type,from_status,to_status,attempt,payload_json) VALUES($1,$2,$3,$4,$5,$6::jsonb)`,[operationId,input.eventType??`operation.${status.toLowerCase()}`,from,status,attempt,JSON.stringify(input.payload??{})]);
  return {operationId,status,from,terminal};
}

export async function runtimeOperationSnapshot(operationId:string) {
  const operation=(await query<any>(`SELECT * FROM trust_runtime_operation_snapshot WHERE id=$1`,[operationId])).rows[0];
  if(!operation)return null;
  const events=(await query<any>(`SELECT id,event_type AS "eventType",from_status AS "fromStatus",to_status AS "toStatus",attempt,payload_json AS payload,created_at AS "createdAt" FROM trust_runtime_operation_events WHERE operation_id=$1 ORDER BY id`,[operationId])).rows;
  return {...operation,events};
}

export async function productionExecutionSnapshot(input: { orderId?: string; health?: string; limit?: number } = {}) {
  const limit=Math.min(Math.max(Number(input.limit ?? 50),1),200);
  const params:any[]=[]; const where:string[]=[];
  if(input.orderId){ params.push(input.orderId); where.push(`order_id=$${params.length}`); }
  if(input.health){ params.push(input.health); where.push(`execution_health=$${params.length}`); }
  params.push(limit);
  const rows=await query<any>(`SELECT * FROM trust_production_execution_snapshot${where.length?` WHERE ${where.join(' AND ')}`:''} ORDER BY order_id DESC LIMIT $${params.length}`,params);
  const counts=await query<any>(`SELECT execution_health,count(*)::int AS count FROM trust_production_execution_snapshot${where.length?` WHERE ${where.join(' AND ')}`:''} GROUP BY execution_health ORDER BY execution_health`,params.slice(0,-1));
  return {rows:rows.rows,healthCounts:counts.rows};
}

export async function runtimeSpineSnapshot(tenantId='default') {
  const [counts,recent,failed]=await Promise.all([
    query<any>(`SELECT status,count(*)::int AS count FROM trust_runtime_operations WHERE tenant_id=$1 GROUP BY status ORDER BY status`,[tenantId]),
    query<any>(`SELECT id,operation_type AS "operationType",operation_key AS "operationKey",aggregate_type AS "aggregateType",aggregate_id AS "aggregateId",status,attempt_count AS "attemptCount",last_error_code AS "lastErrorCode",updated_at AS "updatedAt" FROM trust_runtime_operations WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 25`,[tenantId]),
    query<any>(`SELECT count(*)::int AS count FROM trust_runtime_operations WHERE tenant_id=$1 AND status IN ('FAILED','DEAD')`,[tenantId]),
  ]);
  return {tenantId,statusCounts:counts.rows,recentOperations:recent.rows,failedCount:Number(failed.rows[0]?.count??0)};
}


export async function ensureOrderRuntimeOperationTx(tx: PoolClient, orderId: string, input: { tenantId?: string; correlationId?: string; causationId?: string; metadata?: Record<string, unknown> } = {}) {
  return ensureRuntimeOperationTx(tx, {
    tenantId: input.tenantId,
    operationType: 'commerce.order',
    operationKey: orderId,
    aggregateType: 'order',
    aggregateId: orderId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    metadata: input.metadata,
  });
}

export const GLOBAL_RUNTIME_SPINE_VERSION='V409.0.0';
