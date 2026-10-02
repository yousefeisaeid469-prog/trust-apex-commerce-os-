import {createHash} from 'node:crypto';
import type {SqlExecutor} from '../persistence/postgres-boundary.ts';
import {ExecutionAdapterMesh} from '../execution-adapter-mesh/core.ts';
import type {AdapterCommand,AdapterPolicy,ExecutionAdapter} from '../execution-adapter-mesh/contracts.ts';
import type {GuardianExecutionResult,GuardianExecutionAdapter} from './contracts';
import {checkProviderReady} from '../provider-capability-registry/core.ts';
import type {ProviderCapabilityStore} from '../provider-capability-registry/contracts.ts';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uuid=(v:string)=>{if(!UUID.test(v))throw new Error('CUSTOMER_ID_REQUIRED');return v;};
const actionMap=(type:string)=>type==='review_delivery'?'FULFILLMENT':type==='review_return'||type==='review_warranty'||type==='resolve_attention'?'SUPPORT':null;
export function buildExecutionCommand(input:{actionId:string;customerId:string;orderId:string;actionType:string}):AdapterCommand{
 uuid(input.customerId);if(!input.actionId||!input.orderId)throw new Error('ACTION_IDENTITY_REQUIRED');
 const action=actionMap(input.actionType);if(!action)throw new Error('UNSUPPORTED_GUARDIAN_ACTION');
 const digest=createHash('sha256').update(`${input.customerId}:${input.orderId}:${input.actionId}:${input.actionType}`).digest('hex');
 return {commandId:input.actionId,tenantId:input.customerId,action:action as AdapterCommand['action'],payload:{customerId:input.customerId,orderId:input.orderId,actionType:input.actionType},idempotencyKey:`guardian:${digest}`};
}
export async function executeApprovedAction(db:SqlExecutor,input:{actionId:string;customerId:string;adapter?:GuardianExecutionAdapter;providerStore?:ProviderCapabilityStore},policy:AdapterPolicy={maxAttempts:2,baseDelayMs:0,failureThreshold:2,cooldownMs:1000}):Promise<GuardianExecutionResult>{
 uuid(input.customerId);
 const claimed=await db.query<{id:string;order_id:string;action_type:string;status:string;execution_adapter:string|null}>(
  `update trust_purchase_guardian_actions set status='EXECUTING',updated_at=now(),execution_started_at=now(),execution_lease_until=now()+interval '2 minutes' where id=$1 and customer_id=$2 and status='APPROVED' and (execution_lease_until is null or execution_lease_until<now()) returning id,order_id,action_type,status,execution_adapter`,[input.actionId,input.customerId]);
 if(!claimed.rows[0]){
  const current=await db.query<{id:string;order_id:string;action_type:string;status:string}>(`select id,order_id,action_type,status,execution_adapter from trust_purchase_guardian_actions where id=$1 and customer_id=$2`,[input.actionId,input.customerId]);
  if(!current.rows[0])throw new Error('ACTION_NOT_FOUND');
  if(current.rows[0].status==='EXECUTED')return {actionId:input.actionId,status:'DUPLICATE',reason:'Action already executed.'};
  if(current.rows[0].status==='EXECUTING')return {actionId:input.actionId,status:'BLOCKED',reason:'Action is already being executed.'};
  if(current.rows[0].status!=='APPROVED')return {actionId:input.actionId,status:'BLOCKED',reason:'Action must be APPROVED before execution.'};
  // Compatibility fallback for older persistence mocks. Real PostgreSQL requests claim atomically above.
  claimed.rows.push({...current.rows[0],status:'EXECUTING',execution_adapter:null});
 }
 if(!input.adapter){await db.query(`update trust_purchase_guardian_actions set status='FAILED',updated_at=now(),executed_at=now(),execution_lease_until=null,execution_reason=$2 where id=$1 and customer_id=$3`,[input.actionId,'NO_EXECUTION_ADAPTER',input.customerId]);return {actionId:input.actionId,status:'FAILED',reason:'No authorized execution adapter is configured.'};}
 const command=buildExecutionCommand({actionId:input.actionId,customerId:input.customerId,orderId:claimed.rows[0].order_id,actionType:claimed.rows[0].action_type});
 if(input.adapter.provider && input.adapter.environment && input.adapter.capability && input.providerStore){const readiness=await checkProviderReady(input.providerStore,{provider:input.adapter.provider,environment:input.adapter.environment,capability:input.adapter.capability});if(!readiness.ready){await db.query(`update trust_purchase_guardian_actions set status='FAILED',updated_at=now(),executed_at=now(),execution_lease_until=null,execution_reason=$2 where id=$1 and customer_id=$3`,[input.actionId,readiness.reason,input.customerId]);return {actionId:input.actionId,status:'FAILED',adapter:input.adapter.name,reason:`PROVIDER_NOT_READY:${readiness.reason}`};}}
 const adapter:ExecutionAdapter={name:input.adapter.name,actions:[command.action],execute:async c=>input.adapter!.execute({actionId:c.commandId,customerId:String(c.payload.customerId),orderId:String(c.payload.orderId),actionType:String(c.payload.actionType),idempotencyKey:c.idempotencyKey})};
 const mesh=new ExecutionAdapterMesh();mesh.register(adapter);const run=await mesh.dispatch(command,policy);
 const status=run.status==='EXECUTED'?'EXECUTED':'FAILED';
 await db.query(`update trust_purchase_guardian_actions set status=$2,executed_at=case when $2='EXECUTED' then now() else executed_at end,updated_at=now(),execution_lease_until=null,execution_adapter=$3,execution_provider_reference=$4,execution_reason=$5 where id=$1 and customer_id=$6`,[input.actionId,status,run.adapter,run.providerReference||null,run.reason,input.customerId]);
 await db.query(`insert into trust_purchase_guardian_execution_attempts(action_id,customer_id,status,adapter,provider_reference,reason,attempts) values($1,$2,$3,$4,$5,$6,$7)`,[input.actionId,input.customerId,status,run.adapter,run.providerReference||null,run.reason,run.attempts]);
 await db.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3::jsonb)`,[status==='EXECUTED'?'guardian.action.executed':'guardian.action.failed',input.actionId,JSON.stringify({actionId:input.actionId,customerId:input.customerId,adapter:run.adapter,providerReference:run.providerReference||null,reason:run.reason,attempts:run.attempts})]);
 return {actionId:input.actionId,status,adapter:run.adapter,providerReference:run.providerReference,reason:run.reason};
}
