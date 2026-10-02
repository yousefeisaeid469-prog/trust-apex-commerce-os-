import type { PoolClient } from 'pg';
import { submitCommandTx } from './command-bus.ts';
import { query } from './db/postgres.ts';
import { ensureRuntimeOperationTx, transitionRuntimeOperationTx } from './runtime-spine.ts';

export type WorkflowStepDefinition = {
  key: string;
  commandType?: string;
  payload?: Record<string, unknown>;
  stepType?: 'COMMAND' | 'WAIT_FOR_EVENT';
  waitEventType?: string;
  waitEventKey?: string;
  compensationCommandType?: string;
  compensationPayload?: Record<string, unknown>;
};
export type WorkflowDefinition = { type:string; aggregateType:string; steps:readonly WorkflowStepDefinition[] };
const definitions=new Map<string,WorkflowDefinition>();
export function registerWorkflow(definition:WorkflowDefinition){
  if(!definition.type||!definition.aggregateType||!definition.steps.length)throw new Error('WORKFLOW_DEFINITION_INVALID');
  if(new Set(definition.steps.map(s=>s.key)).size!==definition.steps.length)throw new Error('WORKFLOW_STEP_KEYS_NOT_UNIQUE');
  for(const s of definition.steps){
    const kind=s.stepType??'COMMAND';
    if(kind==='COMMAND'&&!s.commandType)throw new Error('WORKFLOW_COMMAND_TYPE_REQUIRED');
    if(kind==='WAIT_FOR_EVENT'&&(!s.waitEventType||!s.waitEventKey))throw new Error('WORKFLOW_WAIT_EVENT_REQUIRED');
  }
  definitions.set(definition.type,definition);
}
export function workflowDefinition(type:string){return definitions.get(type);}

export async function startWorkflowTx(tx:PoolClient,input:{tenantId?:string;workflowType:string;aggregateType:string;aggregateId:string;input?:Record<string,unknown>;correlationId?:string;causationId?:string;idempotencyKey:string}){
  const definition=definitions.get(input.workflowType); if(!definition)throw new Error('WORKFLOW_NOT_REGISTERED');
  const tenant=input.tenantId??'default';
  const existing=await tx.query<{id:string;status:string}>(`SELECT id,status FROM trust_workflow_instances WHERE tenant_id=$1 AND workflow_type=$2 AND aggregate_type=$3 AND aggregate_id=$4 AND (input_json->>'idempotencyKey')=$5 ORDER BY created_at DESC LIMIT 1`,[tenant,input.workflowType,input.aggregateType,input.aggregateId,input.idempotencyKey]);
  if(existing.rows[0])return{workflowId:existing.rows[0].id,replay:true,status:existing.rows[0].status};
  const inserted=await tx.query<{id:string}>(`INSERT INTO trust_workflow_instances(tenant_id,workflow_type,aggregate_type,aggregate_id,correlation_id,causation_id,input_json) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING id`,[tenant,input.workflowType,input.aggregateType,input.aggregateId,input.correlationId??null,input.causationId??null,JSON.stringify({...input.input??{},idempotencyKey:input.idempotencyKey})]);
  const workflowId=String(inserted.rows[0].id);
  await ensureRuntimeOperationTx(tx,{tenantId,operationType:'workflow',operationKey:workflowId,aggregateType:input.aggregateType,aggregateId:input.aggregateId,workflowId,correlationId:input.correlationId,causationId:input.causationId,metadata:{workflowType:input.workflowType}});
  for(let i=0;i<definition.steps.length;i++){const s=definition.steps[i];const type=s.stepType??'COMMAND';await tx.query(`INSERT INTO trust_workflow_steps(workflow_id,step_index,step_key,command_type,command_payload_json,compensation_command_type,compensation_payload_json,step_type,wait_event_type,wait_event_key) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8,$9,$10)`,[workflowId,i,s.key,s.commandType??`workflow.wait.${s.waitEventType}`,JSON.stringify(s.payload??{}),s.compensationCommandType??null,s.compensationPayload?JSON.stringify(s.compensationPayload):null,type,s.waitEventType??null,s.waitEventKey??null]);}
  await tx.query(`INSERT INTO trust_workflow_events(workflow_id,event_type,payload_json) VALUES($1,'workflow.started',$2::jsonb)`,[workflowId,JSON.stringify({workflowType:input.workflowType,aggregateId:input.aggregateId,steps:definition.steps.map(s=>s.key)})]);
  return{workflowId,replay:false,status:'RUNNING'};
}

export async function signalWorkflowEventTx(tx:PoolClient,input:{eventType:string;eventKey:string;payload?:Record<string,unknown>}){
  const waiting=await tx.query<any>(`SELECT s.*,w.id AS workflow_id,w.status AS workflow_status FROM trust_workflow_steps s JOIN trust_workflow_instances w ON w.id=s.workflow_id WHERE s.status IN ('PENDING','WAITING_EVENT') AND s.step_type='WAIT_FOR_EVENT' AND s.wait_event_type=$1 AND s.wait_event_key=$2 ORDER BY s.created_at,s.id FOR UPDATE OF s SKIP LOCKED`,[input.eventType,input.eventKey]);
  let signaled=0;
  for(const s of waiting.rows){
    const inserted=await tx.query(`INSERT INTO trust_workflow_signals(workflow_id,step_id,event_type,event_key,payload_json) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(workflow_id,event_type,event_key) DO NOTHING RETURNING id`,[s.workflow_id,s.id,input.eventType,input.eventKey,JSON.stringify(input.payload??{})]);
    if(!inserted.rows[0])continue;
    await tx.query(`UPDATE trust_workflow_steps SET status='SUCCEEDED',event_payload_json=$2::jsonb,completed_at=now(),locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,[s.id,JSON.stringify(input.payload??{})]);
    const next=await tx.query<any>(`SELECT id,step_index FROM trust_workflow_steps WHERE workflow_id=$1 AND status='PENDING' ORDER BY step_index LIMIT 1`,[s.workflow_id]);
    if(next.rows[0]){
      const nextType=(await tx.query(`SELECT step_type FROM trust_workflow_steps WHERE id=$1`,[next.rows[0].id])).rows[0]?.step_type;
      if(nextType==='WAIT_FOR_EVENT') await tx.query(`UPDATE trust_workflow_steps SET status='WAITING_EVENT',updated_at=now() WHERE id=$1`,[next.rows[0].id]);
      await tx.query(`UPDATE trust_workflow_instances SET current_step=$2,updated_at=now() WHERE id=$1`,[s.workflow_id,next.rows[0].step_index]);
      const op=(await tx.query(`SELECT id FROM trust_runtime_operations WHERE workflow_id=$1 FOR UPDATE`,[s.workflow_id])).rows[0];
      if(op) await transitionRuntimeOperationTx(tx,String(op.id),nextType==='WAIT_FOR_EVENT'?'WAITING':'RUNNING',{eventType:'workflow.event.consumed',payload:{eventType:input.eventType,eventKey:input.eventKey,nextStep:next.rows[0].step_index}});
    } else {
      await tx.query(`UPDATE trust_workflow_instances SET status='SUCCEEDED',completed_at=now(),updated_at=now() WHERE id=$1`,[s.workflow_id]);
      const op=(await tx.query(`SELECT id FROM trust_runtime_operations WHERE workflow_id=$1 FOR UPDATE`,[s.workflow_id])).rows[0];
      if(op) await transitionRuntimeOperationTx(tx,String(op.id),'SUCCEEDED',{eventType:'workflow.event.completed',payload:{eventType:input.eventType,eventKey:input.eventKey}});
    }
    await tx.query(`INSERT INTO trust_workflow_events(workflow_id,step_id,event_type,payload_json) VALUES($1,$2,'workflow.event.consumed',$3::jsonb)`,[s.workflow_id,s.id,JSON.stringify({eventType:input.eventType,eventKey:input.eventKey,payload:input.payload??{}})]);
    signaled++;
  }
  return{signaled};
}

export async function workflowSnapshot(workflowId:string){
  const workflow=(await query<any>(`SELECT id,tenant_id AS "tenantId",workflow_type AS "workflowType",aggregate_type AS "aggregateType",aggregate_id AS "aggregateId",status,current_step AS "currentStep",correlation_id AS "correlationId",causation_id AS "causationId",input_json AS input,result_json AS result,failure_code AS "failureCode",failure_message AS "failureMessage",created_at AS "createdAt",updated_at AS "updatedAt",completed_at AS "completedAt" FROM trust_workflow_instances WHERE id=$1`,[workflowId])).rows[0];
  if(!workflow)return null;
  const steps=(await query<any>(`SELECT id,step_index AS "stepIndex",step_key AS "stepKey",step_type AS "stepType",command_type AS "commandType",wait_event_type AS "waitEventType",wait_event_key AS "waitEventKey",status,attempts,command_id AS "commandId",result_json AS result,event_payload_json AS "eventPayload",error_code AS "errorCode",error_message AS "errorMessage",started_at AS "startedAt",completed_at AS "completedAt" FROM trust_workflow_steps WHERE workflow_id=$1 ORDER BY step_index`,[workflowId])).rows;
  return{...workflow,steps};
}
export const V406_ORDER_JOURNEY_WORKFLOW_BRIDGE=true;
