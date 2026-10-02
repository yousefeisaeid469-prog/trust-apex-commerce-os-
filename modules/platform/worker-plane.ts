import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { query } from './db/postgres.ts';

export type WorkerPlaneStatus = 'STARTING'|'RUNNING'|'DRAINING'|'STOPPED'|'FAILED'|'STALE';
export type WorkerRunStatus = 'RUNNING'|'SUCCEEDED'|'FAILED'|'DRAINED';

export type WorkerHandle = {
  workerId: string;
  workerType: string;
  leaseToken: string;
  runId: number;
  leaseSeconds: number;
};

function positiveInt(value: unknown, fallback: number, max: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}

export async function startWorker(workerType: string, options: { workerId?: string; trigger?: string; leaseSeconds?: number; metadata?: Record<string, unknown> } = {}): Promise<WorkerHandle> {
  if (!workerType) throw new Error('WORKER_TYPE_REQUIRED');
  const workerId = options.workerId ?? `${workerType}-${process.pid}-${randomUUID()}`;
  const leaseSeconds = positiveInt(options.leaseSeconds ?? process.env.TRUST_WORKER_LEASE_SECONDS, 90, 3600);
  const leaseToken = randomUUID();
  await query(`
    INSERT INTO trust_worker_instances(worker_id,worker_type,status,hostname,pid,lease_token,lease_expires_at,heartbeat_at,metadata_json)
    VALUES($1,$2,'RUNNING',$3,$4,$5,now()+make_interval(secs=>$6),now(),$7::jsonb)
    ON CONFLICT(worker_id) DO UPDATE SET
      status='RUNNING',hostname=EXCLUDED.hostname,pid=EXCLUDED.pid,lease_token=EXCLUDED.lease_token,
      lease_expires_at=EXCLUDED.lease_expires_at,heartbeat_at=now(),stopped_at=NULL,last_error=NULL,
      metadata_json=EXCLUDED.metadata_json,updated_at=now()`,
    [workerId, workerType, os.hostname(), process.pid, leaseToken, leaseSeconds, JSON.stringify(options.metadata ?? {})]);
  const run = await query<{ id: string }>(`
    INSERT INTO trust_worker_runs(worker_id,worker_type,trigger,status,last_heartbeat_at,metadata_json)
    VALUES($1,$2,$3,'RUNNING',now(),$4::jsonb) RETURNING id`,
    [workerId, workerType, options.trigger ?? (process.argv.includes('--once') ? 'once' : 'loop'), JSON.stringify(options.metadata ?? {})]);
  return { workerId, workerType, leaseToken, runId: Number(run.rows[0].id), leaseSeconds };
}

export async function heartbeatWorker(handle: WorkerHandle, counters: { claimed?: number; succeeded?: number; failed?: number; recovered?: number } = {}) {
  const leaseSeconds = positiveInt(handle.leaseSeconds, 90, 3600);
  const instance = await query(`
    UPDATE trust_worker_instances SET heartbeat_at=now(),lease_expires_at=now()+make_interval(secs=>$4),updated_at=now()
    WHERE worker_id=$1 AND lease_token=$2 AND status IN ('RUNNING','DRAINING') AND lease_expires_at>now()
    RETURNING worker_id`, [handle.workerId, handle.leaseToken, null, leaseSeconds]);
  if (!instance.rows[0]) throw new Error('WORKER_LEASE_LOST');
  await query(`
    UPDATE trust_worker_runs SET claimed_count=claimed_count+$2,succeeded_count=succeeded_count+$3,
      failed_count=failed_count+$4,recovered_count=recovered_count+$5,last_heartbeat_at=now()
    WHERE id=$1 AND worker_id=$6 AND status='RUNNING'`,
    [handle.runId, Number(counters.claimed ?? 0), Number(counters.succeeded ?? 0), Number(counters.failed ?? 0), Number(counters.recovered ?? 0), handle.workerId]);
}

export async function finishWorker(handle: WorkerHandle, status: WorkerRunStatus, input: { errorCode?: string; errorMessage?: string; counters?: { claimed?: number; succeeded?: number; failed?: number; recovered?: number } } = {}) {
  await query(`UPDATE trust_worker_runs SET status=$2,claimed_count=claimed_count+$3,succeeded_count=succeeded_count+$4,failed_count=failed_count+$5,recovered_count=recovered_count+$6,last_heartbeat_at=now(),finished_at=now(),error_code=$7,error_message=$8 WHERE id=$1 AND worker_id=$9`,
    [handle.runId,status,Number(input.counters?.claimed ?? 0),Number(input.counters?.succeeded ?? 0),Number(input.counters?.failed ?? 0),Number(input.counters?.recovered ?? 0),input.errorCode ?? null,input.errorMessage ?? null,handle.workerId]);
  await query(`UPDATE trust_worker_instances SET status=$2,stopped_at=now(),lease_expires_at=now(),updated_at=now(),last_error=$3 WHERE worker_id=$1 AND lease_token=$4`,
    [handle.workerId,status==='FAILED'?'FAILED':status==='DRAINED'?'DRAINING':'STOPPED',input.errorMessage ?? null,handle.leaseToken]);
}

export async function workerPlaneSnapshot(limit = 100) {
  const safe = positiveInt(limit, 100, 500);
  const rows = await query(`SELECT * FROM trust_production_worker_snapshot ORDER BY worker_type,worker_id LIMIT $1`, [safe]);
  return rows.rows;
}

export const GLOBAL_WORKER_PLANE_VERSION = 'V410.0.0';
