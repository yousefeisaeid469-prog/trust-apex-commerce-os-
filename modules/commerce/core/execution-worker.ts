import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { resumeCommerceExecutionTx } from './execution-kernel';
import { recordCommerceFailureTx, resolveCommerceRecoveryTx } from './recovery-closure';

const MAX_ATTEMPTS = 12;
const LEASE_SECONDS = 60;
const WAIT_SECONDS = 30;
const RETRY_BASE_SECONDS = 15;
const RETRY_MAX_SECONDS = 900;

type JobRow = {
  id: string;
  order_id: string;
  execution_run_id: string;
  job_type: 'EXECUTE_ORDER' | 'RECOVER_ORDER';
  attempts: number;
  failure_count: number;
  lease_token?: string;
};

function backoffSeconds(attempt: number) {
  return Math.min(RETRY_MAX_SECONDS, RETRY_BASE_SECONDS * (2 ** Math.min(Math.max(attempt - 1, 0), 6)));
}

export async function enqueueCommerceExecutionJobTx(tx: SqlExecutor, input: {
  orderId: string;
  executionRunId: string;
  idempotencyKey: string;
  jobType?: 'EXECUTE_ORDER' | 'RECOVER_ORDER';
  availableAtSql?: string;
}) {
  const jobType = input.jobType ?? 'EXECUTE_ORDER';
  const result = await tx.query<JobRow>(
    `insert into trust_commerce_execution_jobs(order_id,execution_run_id,job_type,idempotency_key,available_at)
     values($1,$2,$3,$4,${input.availableAtSql ?? 'now()'})
     on conflict(idempotency_key) do update set idempotency_key=trust_commerce_execution_jobs.idempotency_key
     returning id,order_id,execution_run_id,job_type,attempts`,
    [input.orderId, input.executionRunId, jobType, input.idempotencyKey],
  );
  if (!result.rows[0]) throw new Error('COMMERCE_EXECUTION_JOB_CREATE_FAILED');
  return result.rows[0];
}

async function leaseJobs(db: SqlExecutor, limit: number, workerId: string): Promise<JobRow[]> {
  return db.transaction(async tx => {
    const rows = await tx.query<JobRow>(
      `select id,order_id,execution_run_id,job_type,attempts,failure_count
         from trust_commerce_execution_jobs
        where status in ('PENDING','WAITING')
          and available_at<=now()
        order by available_at asc,created_at asc,id asc
        limit $1
        for update skip locked`,
      [Math.min(Math.max(limit, 1), 100)],
    );
    return Promise.all(rows.rows.map(async job => {
      const leaseToken = `${workerId}:${crypto.randomUUID()}`;
      await tx.query(
        `update trust_commerce_execution_jobs
            set status='PROCESSING',attempts=attempts+1,lease_until=now()+($2 || ' seconds')::interval,
                lease_token=$3,last_error_code=null,updated_at=now()
          where id=$1`,
        [job.id, LEASE_SECONDS, leaseToken],
      );
      return { ...job, attempts: Number(job.attempts) + 1, failure_count: Number(job.failure_count), lease_token: leaseToken };
    }));
  });
}

async function recordAttempt(db: SqlExecutor, job: JobRow, outcome: 'SUCCEEDED'|'WAITING'|'FAILED'|'DEAD', result: Record<string, unknown>, errorCode: string | null) {
  await db.query(
    `insert into trust_commerce_execution_attempts(job_id,attempt_number,outcome,error_code,result_json)
     values($1,$2,$3,$4,$5::jsonb)
     on conflict(job_id,attempt_number) do update set outcome=excluded.outcome,error_code=excluded.error_code,result_json=excluded.result_json,finished_at=now()`,
    [job.id, job.attempts, outcome, errorCode, JSON.stringify(result)],
  );
}

async function finishJob(db: SqlExecutor, job: JobRow, outcome: 'SUCCEEDED'|'WAITING'|'FAILED'|'DEAD', result: Record<string, unknown>, errorCode: string | null) {
  const leaseToken = job.lease_token ?? '';
  if (!leaseToken) throw new Error('COMMERCE_EXECUTION_LEASE_TOKEN_MISSING');
  if (outcome === 'SUCCEEDED') {
    await db.query(
      `update trust_commerce_execution_jobs set status='SUCCEEDED',processed_at=now(),lease_until=null,lease_token=null,
          result_json=$2::jsonb,last_error_code=null,updated_at=now() where id=$1 and lease_token=$3`,
      [job.id, JSON.stringify(result), leaseToken],
    );
    return;
  }
  if (outcome === 'WAITING') {
    await db.query(
      `update trust_commerce_execution_jobs set status='WAITING',available_at=now()+($2 || ' seconds')::interval,
          lease_until=null,lease_token=null,result_json=$3::jsonb,last_error_code=$4,updated_at=now() where id=$1 and lease_token=$5`,
      [job.id, WAIT_SECONDS, JSON.stringify(result), errorCode, leaseToken],
    );
    return;
  }
  if (job.failure_count + 1 >= MAX_ATTEMPTS) {
    await db.query(
      `update trust_commerce_execution_jobs set status='DEAD',lease_until=null,lease_token=null,
          result_json=$2::jsonb,last_error_code=$3,updated_at=now() where id=$1 and lease_token=$4`,
      [job.id, JSON.stringify(result), errorCode ?? 'COMMERCE_EXECUTION_MAX_ATTEMPTS', leaseToken],
    );
    return;
  }
  const delay = backoffSeconds(job.attempts);
  await db.query(
    `update trust_commerce_execution_jobs set status='PENDING',available_at=now()+($2 || ' seconds')::interval,
        lease_until=null,lease_token=null,result_json=$3::jsonb,last_error_code=$4,failure_count=failure_count+1,updated_at=now() where id=$1 and lease_token=$5`,
    [job.id, delay, JSON.stringify(result), errorCode, leaseToken],
  );
}

async function executeJob(db: SqlExecutor, job: JobRow) {
  try {
    const result = await db.transaction(async tx => {
      const claim = await claimExecutionTx(tx, {
        scope: 'commerce-job',
        operationKey: `job:${job.id}`,
        fingerprint: executionFingerprint({ orderId: job.order_id, jobType: job.job_type }),
        ownerId: job.lease_token ?? `commerce:${job.id}`,
        leaseSeconds: LEASE_SECONDS,
      });
      if (!claim) throw new Error('EXECUTION_CLAIM_BUSY');
      if (claim.replay) return claim.resultJson ?? {};
      try {
        const value = await resumeCommerceExecutionTx(tx, {
          orderId: job.order_id,
          idempotencyKey: `commerce-job:${job.id}`,
        });
        await completeExecutionClaimTx(tx, claim, value as Record<string, unknown>);
        return value;
      } catch (error) {
        await failExecutionClaimTx(tx, claim, error instanceof Error ? error.message : String(error));
        throw error;
      }
    });
    const action = String(result.action ?? 'NONE');
    const waiting = action === 'WAIT_FULFILLMENT' || action === 'WAIT';
    const outcome = waiting ? 'WAITING' : 'SUCCEEDED';
    await recordAttempt(db, job, outcome, result as Record<string, unknown>, null);
    await finishJob(db, job, outcome, result as Record<string, unknown>, null);
    if (outcome === 'SUCCEEDED') {
      await db.transaction(async tx => {
        await resolveCommerceRecoveryTx(tx, { orderId: job.order_id, jobId: job.id, result: result as Record<string, unknown> });
      });
    }
    return { outcome, result };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : String(error);
    const result = { orderId: job.order_id, jobType: job.job_type, attempt: job.attempts };
    const outcome = job.failure_count + 1 >= MAX_ATTEMPTS ? 'DEAD' : 'FAILED';
    await recordAttempt(db, job, outcome, result, errorCode);
    await finishJob(db, job, outcome, result, errorCode);
    await db.transaction(async tx => {
      await recordCommerceFailureTx(tx, {
        orderId: job.order_id,
        executionRunId: job.execution_run_id,
        jobId: job.id,
        failureCode: errorCode,
        errorMessage: errorCode,
        attempt: job.attempts,
        dead: outcome === 'DEAD',
        metadata: { jobType: job.job_type, workerAttempt: job.attempts },
      });
    });
    return { outcome, errorCode };
  }
}

export async function startCommerceWorkerRun(db: SqlExecutor, input: { workerId: string; trigger: 'vercel-cron'|'standalone'|'manual'|'internal'; region?: string | null }) {
  const result = await db.query<{ id: string }>(
    `insert into trust_commerce_worker_runs(worker_id,trigger,region,status) values($1,$2,$3,'RUNNING') returning id`,
    [input.workerId, input.trigger, input.region ?? null],
  );
  if (!result.rows[0]) throw new Error('COMMERCE_WORKER_RUN_CREATE_FAILED');
  await db.query(
    `update trust_commerce_worker_heartbeat set last_started_at=now(),last_worker_id=$1,last_trigger=$2,last_region=$3,updated_at=now() where singleton=true`,
    [input.workerId, input.trigger, input.region ?? null],
  );
  return String(result.rows[0].id);
}

export async function finishCommerceWorkerRun(db: SqlExecutor, runId: string, result: { claimed:number;succeeded:number;waiting:number;failed:number;dead:number;recovered?:number }, errorCode?: string | null) {
  const status = errorCode ? 'FAILED' : 'SUCCEEDED';
  await db.query(
    `update trust_commerce_worker_runs set status=$2,claimed=$3,succeeded=$4,waiting=$5,failed=$6,dead=$7,recovered=$8,error_code=$9,finished_at=now(),updated_at=now() where id=$1`,
    [runId,status,result.claimed,result.succeeded,result.waiting,result.failed,result.dead,result.recovered ?? 0,errorCode ?? null],
  );
  await db.query(
    `update trust_commerce_worker_heartbeat set last_finished_at=now(),last_success_at=case when $2='SUCCEEDED' then now() else last_success_at end,last_failure_at=case when $2='FAILED' then now() else last_failure_at end,last_claimed=$3,last_succeeded=$4,last_waiting=$5,last_failed=$6,last_dead=$7,last_recovered=$8,last_error_code=$9,updated_at=now() where singleton=true`,
    [runId,status,result.claimed,result.succeeded,result.waiting,result.failed,result.dead,result.recovered ?? 0,errorCode ?? null],
  );
}

export async function runCommerceExecutionWorker(db: SqlExecutor, options: { limit?: number; workerId?: string } = {}) {
  const workerId = options.workerId ?? `commerce-worker:${crypto.randomUUID()}`;
  const jobs = await leaseJobs(db, options.limit ?? 10, workerId);
  let succeeded = 0;
  let waiting = 0;
  let failed = 0;
  let dead = 0;
  for (const job of jobs) {
    const result = await executeJob(db, job);
    if (result.outcome === 'SUCCEEDED') succeeded += 1;
    else if (result.outcome === 'WAITING') waiting += 1;
    else if (result.outcome === 'DEAD') dead += 1;
    else failed += 1;
  }
  return { workerId, claimed: jobs.length, succeeded, waiting, failed, dead, maxAttempts: MAX_ATTEMPTS };
}

export async function recoverExpiredCommerceExecutionLeases(db: SqlExecutor) {
  const result = await db.query<{ id: string }>(
    `update trust_commerce_execution_jobs
        set status='PENDING',lease_until=null,lease_token=null,available_at=now(),updated_at=now(),
            last_error_code='WORKER_LEASE_EXPIRED'
      where status='PROCESSING' and lease_until<now()
      returning id`,
  );
  return { recovered: result.rows.length };
}

export async function deadLetterCommerceExecutionJobs(db: SqlExecutor, limit = 100) {
  const result = await db.query(
    `select * from trust_commerce_execution_jobs where status='DEAD' order by updated_at desc limit $1`,
    [Math.min(Math.max(limit, 1), 500)],
  );
  return result.rows;
}
