import { randomUUID } from 'node:crypto';
import type { SqlExecutor } from './persistence/postgres-boundary';
import { query } from './db/postgres';

export type WorkerSlot = { queueName: string; workerId: string; slotToken: string; leaseSeconds: number };

function int(value: unknown, fallback: number, max: number) {
  const n=Number(value); return Number.isInteger(n)&&n>0 ? Math.min(n,max) : fallback;
}

export async function acquireWorkerSlot(queueName:string, workerId:string, leaseSeconds=90):Promise<WorkerSlot|null> {
  if(!queueName||!workerId) throw new Error('WORKER_QUEUE_ID_REQUIRED');
  const token=randomUUID(); const seconds=int(leaseSeconds,90,3600);
  const result=await query<{slot_token:string;lease_seconds:number}>(`
    WITH policy AS (
      SELECT queue_name,priority,max_concurrency,lease_seconds,drain
      FROM trust_worker_queue_policies WHERE queue_name=$1 FOR UPDATE
    ),
    active AS (
      SELECT count(*)::int AS n FROM trust_worker_queue_slots s
      WHERE s.queue_name=$1 AND s.lease_expires_at>now() AND s.worker_id<>$2
    ),
    admitted AS (
      INSERT INTO trust_worker_queue_slots(queue_name,worker_id,slot_token,lease_expires_at)
      SELECT p.queue_name,$2,$3,now()+make_interval(secs=>least($4,p.lease_seconds))
      FROM policy p,active a
      WHERE NOT p.drain AND a.n<p.max_concurrency
      ON CONFLICT(queue_name,worker_id) DO UPDATE SET slot_token=excluded.slot_token,lease_expires_at=excluded.lease_expires_at
      RETURNING slot_token
    )
    SELECT a.slot_token,p.lease_seconds FROM admitted a JOIN policy p ON true`,
    [queueName,workerId,token,seconds]);
  if(!result.rows[0]) {
    await query(`INSERT INTO trust_worker_dispatch_events(queue_name,worker_id,action,reason) VALUES($1,$2,'REJECTED_BACKPRESSURE',$3)`,[queueName,workerId,'queue_drain_or_concurrency_limit']);
    return null;
  }
  await query(`INSERT INTO trust_worker_dispatch_events(queue_name,worker_id,action,reason) VALUES($1,$2,'ADMITTED',$3)`,[queueName,workerId,'slot_acquired']);
  return {queueName,workerId,slotToken:String(result.rows[0].slot_token),leaseSeconds:Number(result.rows[0].lease_seconds)};
}

export async function heartbeatWorkerSlot(slot:WorkerSlot) {
  const result=await query(`UPDATE trust_worker_queue_slots SET lease_expires_at=now()+make_interval(secs=>$4) WHERE queue_name=$1 AND worker_id=$2 AND slot_token=$3 AND lease_expires_at>now() RETURNING worker_id`,[slot.queueName,slot.workerId,slot.slotToken,slot.leaseSeconds]);
  if(!result.rows[0]) throw new Error('WORKER_SLOT_LEASE_LOST');
}

export async function releaseWorkerSlot(slot:WorkerSlot, action:'RELEASED'|'DRAINED'='RELEASED') {
  await query(`DELETE FROM trust_worker_queue_slots WHERE queue_name=$1 AND worker_id=$2 AND slot_token=$3`,[slot.queueName,slot.workerId,slot.slotToken]);
  await query(`INSERT INTO trust_worker_dispatch_events(queue_name,worker_id,action,reason) VALUES($1,$2,$3,$4)`,[slot.queueName,slot.workerId,action,action==='DRAINED'?'queue_drain':'work_complete']);
}

export async function reclaimStaleWorkerSlots() {
  const result=await query(`DELETE FROM trust_worker_queue_slots WHERE lease_expires_at<=now() RETURNING queue_name,worker_id`);
  for(const row of result.rows) await query(`INSERT INTO trust_worker_dispatch_events(queue_name,worker_id,action,reason) VALUES($1,$2,'STALE_RECLAIMED',$3)`,[row.queue_name,row.worker_id,'slot_lease_expired']);
  return {reclaimed:result.rows.length};
}

export async function workerSchedulingSnapshot(limit=100) {
  const safe=int(limit,100,500);
  return (await query(`SELECT * FROM trust_worker_scheduling_snapshot ORDER BY priority DESC,queue_name LIMIT $1`,[safe])).rows;
}

export async function withWorkerSlot<T>(queueName:string,workerId:string,fn:(slot:WorkerSlot)=>Promise<T>,leaseSeconds=90):Promise<T|null> {
  const slot=await acquireWorkerSlot(queueName,workerId,leaseSeconds);
  if(!slot) return null;
  try { return await fn(slot); }
  finally { await releaseWorkerSlot(slot); }
}

export const GLOBAL_WORKER_SCHEDULER_VERSION='V411.0.0';
