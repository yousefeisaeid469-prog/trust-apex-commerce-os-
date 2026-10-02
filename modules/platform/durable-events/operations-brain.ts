import { query } from '../db/postgres.ts';
import { getConsumerHealth, recoverStaleConsumerDeliveries } from './consumer-control-plane.ts';

export type OperationsState = 'HEALTHY'|'DEGRADED'|'CRITICAL'|'UNKNOWN';
export type OperationsIncident = {
  code:string;
  severity:'DEGRADED'|'CRITICAL';
  domain:'PUBLISHER'|'CONSUMERS'|'EXECUTION';
  message:string;
  count:number;
  suggestedAction:'START_PUBLISHER'|'START_CONSUMER_WORKER'|'RUN_EXECUTION_WORKER'|'INSPECT_DEAD_LETTERS'|'INSPECT_PROVIDER_OR_DATABASE';
};

const PUBLISHER_STALE_MS = Math.max(120_000, Number(process.env.TRUST_PUBLISHER_STALE_MS ?? 36*60*60*1000));
const EXECUTION_STALE_MS = Math.max(120_000, Number(process.env.TRUST_EXECUTION_WORKER_STALE_MS ?? 36*60*60*1000));
const CONSUMER_STALE_MS = Math.max(30_000, Number(process.env.TRUST_CONSUMER_HEARTBEAT_STALE_MS ?? 120_000));

function ageMs(value:unknown){ return value ? Date.now()-new Date(String(value)).getTime() : Number.POSITIVE_INFINITY; }
function stateForHeartbeat(lastFinished:unknown, staleMs:number){
  if(!lastFinished) return 'UNKNOWN' as const;
  return ageMs(lastFinished)>staleMs ? 'DEGRADED' as const : 'HEALTHY' as const;
}

export async function observeCommerceOperations(){
  const [publisher, execution, consumers] = await Promise.all([
    query<any>(`select h.last_finished_at,h.last_success_at,h.last_failure_at,h.last_error,
      coalesce(q.ready,0)::int ready,coalesce(q.processing,0)::int processing,coalesce(q.dead,0)::int dead
      from trust_commerce_event_publisher_heartbeat h
      cross join lateral (select count(*) filter(where status in ('pending','failed') and available_at<=now())::int ready,
      count(*) filter(where status='processing')::int processing,count(*) filter(where status='dead')::int dead from trust_outbox_events) q
      where h.singleton=true`),
    query<any>(`select h.last_finished_at,h.last_success_at,h.last_failure_at,h.last_error_code,
      coalesce(q.pending,0)::int pending,coalesce(q.processing,0)::int processing,coalesce(q.dead,0)::int dead
      from trust_commerce_worker_heartbeat h
      cross join lateral (select count(*) filter(where status in ('PENDING','WAITING') and available_at<=now())::int pending,
      count(*) filter(where status='PROCESSING')::int processing,count(*) filter(where status='DEAD')::int dead from trust_commerce_execution_jobs) q
      where h.singleton=true`),
    getConsumerHealth(),
  ]);

  const p = publisher.rows[0] ?? null;
  const e = execution.rows[0] ?? null;
  const incidents:OperationsIncident[] = [];
  const publisherState = p ? stateForHeartbeat(p.last_finished_at,PUBLISHER_STALE_MS) : 'UNKNOWN';
  const executionState = e ? stateForHeartbeat(e.last_finished_at,EXECUTION_STALE_MS) : 'UNKNOWN';
  const degradedConsumers = consumers.filter(c=>c.state!=='HEALTHY');

  if(!p) incidents.push({code:'PUBLISHER_HEARTBEAT_MISSING',severity:'CRITICAL',domain:'PUBLISHER',message:'Publisher heartbeat is unavailable.',count:1,suggestedAction:'START_PUBLISHER'});
  else if(p.dead>0) incidents.push({code:'PUBLISHER_DEAD_EVENTS',severity:'CRITICAL',domain:'PUBLISHER',message:'Outbox contains dead publisher events.',count:Number(p.dead),suggestedAction:'INSPECT_DEAD_LETTERS'});
  else if(p.ready>0 && publisherState!=='HEALTHY') incidents.push({code:'PUBLISHER_NOT_DRAINING',severity:'CRITICAL',domain:'PUBLISHER',message:'Publishable outbox work exists but publisher heartbeat is stale.',count:Number(p.ready),suggestedAction:'START_PUBLISHER'});

  if(!e) incidents.push({code:'EXECUTION_HEARTBEAT_MISSING',severity:'CRITICAL',domain:'EXECUTION',message:'Commerce execution worker heartbeat is unavailable.',count:1,suggestedAction:'RUN_EXECUTION_WORKER'});
  else if(e.dead>0) incidents.push({code:'EXECUTION_DEAD_JOBS',severity:'CRITICAL',domain:'EXECUTION',message:'Commerce execution contains dead jobs.',count:Number(e.dead),suggestedAction:'INSPECT_DEAD_LETTERS'});
  else if(e.pending>0 && executionState!=='HEALTHY') incidents.push({code:'EXECUTION_NOT_DRAINING',severity:'CRITICAL',domain:'EXECUTION',message:'Executable commerce jobs exist but the worker heartbeat is stale.',count:Number(e.pending),suggestedAction:'RUN_EXECUTION_WORKER'});

  if(degradedConsumers.length){
    const critical = degradedConsumers.filter(c=>c.state==='DEGRADED' && (c.deadLettered>0 || c.heartbeatStale || c.processing>0));
    incidents.push({code:'CONSUMER_MESH_DEGRADED',severity:critical.length?'CRITICAL':'DEGRADED',domain:'CONSUMERS',message:`${degradedConsumers.length} consumer(s) require attention.`,count:degradedConsumers.length,suggestedAction:critical.length?'START_CONSUMER_WORKER':'INSPECT_DEAD_LETTERS'});
  }

  const consumerPending=consumers.reduce((n,c)=>n+c.pending,0);
  const consumerProcessing=consumers.reduce((n,c)=>n+c.processing,0);
  const consumerRetrying=consumers.reduce((n,c)=>n+c.retrying,0);
  const consumerDead=consumers.reduce((n,c)=>n+c.deadLettered,0);
  const staleConsumerDeliveries=consumers.reduce((n,c)=>n+(c.oldestProcessingAt && ageMs(c.oldestProcessingAt)>CONSUMER_STALE_MS?c.processing:0),0);
  if(staleConsumerDeliveries>0 && !incidents.some(i=>i.code==='CONSUMER_MESH_DEGRADED')) incidents.push({code:'STALE_CONSUMER_DELIVERIES',severity:'CRITICAL',domain:'CONSUMERS',message:'Consumer deliveries have exceeded their lease age.',count:staleConsumerDeliveries,suggestedAction:'START_CONSUMER_WORKER'});

  const critical = incidents.some(i=>i.severity==='CRITICAL');
  const degraded = incidents.length>0;
  const state:OperationsState = critical?'CRITICAL':degraded?'DEGRADED':(publisherState==='UNKNOWN'||executionState==='UNKNOWN'?'UNKNOWN':'HEALTHY');
  return {
    state,publisherState,consumerState:degradedConsumers.length?'DEGRADED':'HEALTHY',executionState,
    publisherHeartbeatAt:p?.updated_at ? new Date(String(p.updated_at)).toISOString() : null,
    publisherLastSuccessAt:p?.last_success_at ? new Date(String(p.last_success_at)).toISOString() : null,
    executionHeartbeatAt:e?.updated_at ? new Date(String(e.updated_at)).toISOString() : null,
    executionLastSuccessAt:e?.last_success_at ? new Date(String(e.last_success_at)).toISOString() : null,
    metrics:{readyOutboxCount:Number(p?.ready||0),outboxProcessingCount:Number(p?.processing||0),outboxDeadCount:Number(p?.dead||0),executionPendingCount:Number(e?.pending||0),executionProcessingCount:Number(e?.processing||0),executionDeadCount:Number(e?.dead||0),consumerPendingCount:consumerPending,consumerProcessingCount:consumerProcessing,consumerRetryingCount:consumerRetrying,consumerDeadLetterCount:consumerDead,staleConsumerDeliveryCount:staleConsumerDeliveries},
    incidents,consumers,observedAt:new Date().toISOString(),
  };
}

export async function captureCommerceOperationsSnapshot(){
  const observation=await observeCommerceOperations();
  await query(`insert into trust_commerce_operations_snapshots(state,publisher_state,consumer_state,execution_state,ready_outbox_count,outbox_processing_count,outbox_dead_count,execution_pending_count,execution_processing_count,execution_dead_count,consumer_pending_count,consumer_processing_count,consumer_retrying_count,consumer_dead_letter_count,stale_consumer_delivery_count,incident_count,incidents) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)`,[
    observation.state,observation.publisherState,observation.consumerState,observation.executionState,
    observation.metrics.readyOutboxCount,observation.metrics.outboxProcessingCount,observation.metrics.outboxDeadCount,
    observation.metrics.executionPendingCount,observation.metrics.executionProcessingCount,observation.metrics.executionDeadCount,
    observation.metrics.consumerPendingCount,observation.metrics.consumerProcessingCount,observation.metrics.consumerRetryingCount,observation.metrics.consumerDeadLetterCount,observation.metrics.staleConsumerDeliveryCount,
    observation.incidents.length,JSON.stringify(observation.incidents),
  ]);
  return observation;
}

export async function runCommerceOperationsRecovery(){
  const consumerRecovery=await recoverStaleConsumerDeliveries();
  const execution=await query<any>(`with stale as (select id from trust_commerce_execution_jobs where status='PROCESSING' and lease_until<now() order by lease_until asc for update skip locked limit 500) update trust_commerce_execution_jobs j set status='PENDING',lease_until=null,lease_token=null,available_at=now(),updated_at=now() from stale s where j.id=s.id returning j.id`);
  return {consumerRecovery,executionRecovered:execution.rowCount??0};
}
