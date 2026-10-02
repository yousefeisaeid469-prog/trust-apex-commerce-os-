import { randomUUID } from 'node:crypto';
import { query } from '../db/postgres.ts';
import { renewDeliveryLease } from './store.ts';

export type ConsumerTrigger = 'standalone' | 'vercel-cron' | 'manual' | 'internal';
export type ConsumerRunCounters = { claimed:number; processed:number; retried:number; deadLettered:number; failed:number };

export async function startConsumerRun(consumerId:string, trigger:ConsumerTrigger, workerId=`commerce-consumer-${consumerId}-${randomUUID()}`) {
  const result = await query<any>(
    `insert into trust_commerce_consumer_runs(consumer_id,worker_id,trigger,status)
     values($1,$2,$3,'RUNNING') returning id`, [consumerId,workerId,trigger]);
  await query(
    `insert into trust_commerce_consumer_heartbeat(consumer_id,last_started_at,last_worker_id,last_trigger,updated_at)
     values($1,now(),$2,$3,now())
     on conflict(consumer_id) do update set last_started_at=now(),last_worker_id=excluded.last_worker_id,last_trigger=excluded.last_trigger,updated_at=now()`,
    [consumerId,workerId,trigger]);
  return { runId:String(result.rows[0].id), workerId };
}

export async function heartbeatConsumerRun(consumerId:string, runId:string, counters:ConsumerRunCounters, error?:string|null) {
  await query(`update trust_commerce_consumer_runs set claimed=$3,processed=$4,retried=$5,dead_lettered=$6,failed=$7,last_error=$8,updated_at=now() where id=$1 and consumer_id=$2`,
    [runId,consumerId,counters.claimed,counters.processed,counters.retried,counters.deadLettered,counters.failed,error?.slice(0,2000) ?? null]);
  await query(`update trust_commerce_consumer_heartbeat set last_claimed=$2,last_processed=$3,last_retried=$4,last_dead_lettered=$5,last_failed=$6,last_error=$7,updated_at=now() where consumer_id=$1`,
    [consumerId,counters.claimed,counters.processed,counters.retried,counters.deadLettered,counters.failed,error?.slice(0,2000) ?? null]);
}

export async function finishConsumerRun(consumerId:string, runId:string, counters:ConsumerRunCounters, status:'SUCCEEDED'|'DEGRADED'|'FAILED', error?:string|null) {
  await heartbeatConsumerRun(consumerId,runId,counters,error);
  await query(`update trust_commerce_consumer_runs set status=$3,finished_at=now(),updated_at=now() where id=$1 and consumer_id=$2`,[runId,consumerId,status]);
  await query(`update trust_commerce_consumer_heartbeat set last_finished_at=now(),last_success_at=case when $2='SUCCEEDED' then now() else last_success_at end,last_failure_at=case when $2='FAILED' then now() else last_failure_at end,updated_at=now() where consumer_id=$1`,[consumerId,status]);
}

export async function renewConsumerDeliveryLease(tenantId:string,eventId:string,consumerId:string,workerId:string) {
  return renewDeliveryLease({tenantId,eventId,consumerId,workerId});
}
