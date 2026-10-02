import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { expireCredits } from './store-credit';

const MAX_ATTEMPTS = 5;
const LEASE_SECONDS = 60;

type JobRow = { id: string; job_type: string; aggregate_id: string; attempts: number };

async function leaseJobs(db: SqlExecutor, limit: number): Promise<JobRow[]> {
  return db.transaction(async tx => {
    const result = await tx.query<JobRow>(`select id,job_type,aggregate_id,attempts from trust_reverse_commerce_jobs where status='PENDING' and available_at<=now() and (lease_until is null or lease_until<now()) order by available_at asc limit $1 for update skip locked`, [limit]);
    for (const job of result.rows) await tx.query(`update trust_reverse_commerce_jobs set status='PROCESSING',lease_until=now()+($2 || ' seconds')::interval,attempts=attempts+1,updated_at=now() where id=$1`, [job.id, LEASE_SECONDS]);
    return result.rows;
  });
}

async function finish(db: SqlExecutor, jobId: string) {
  await db.query(`update trust_reverse_commerce_jobs set status='DONE',processed_at=now(),lease_until=null,updated_at=now() where id=$1`, [jobId]);
}

async function fail(db: SqlExecutor, job: JobRow, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (job.attempts >= MAX_ATTEMPTS) {
    await db.query(`update trust_reverse_commerce_jobs set status='DEAD',last_error=$2,lease_until=null,updated_at=now() where id=$1`, [job.id, message]);
    return;
  }
  const delay = Math.min(3600, 2 ** Math.max(0, job.attempts) * 15);
  await db.query(`update trust_reverse_commerce_jobs set status='PENDING',last_error=$2,available_at=now()+($3 || ' seconds')::interval,lease_until=null,updated_at=now() where id=$1`, [job.id, message, delay]);
}

export async function enqueueReverseCommerceJob(db: SqlExecutor, jobType: JobRow['job_type'], aggregateId: string) {
  const result = await db.query<any>(`insert into trust_reverse_commerce_jobs(job_type,aggregate_id) values($1,$2) returning *`, [jobType, aggregateId]);
  return result.rows[0];
}

export async function runReverseCommerceWorker(db: SqlExecutor, limit = 25) {
  const jobs = await leaseJobs(db, Math.min(Math.max(limit, 1), 100));
  let done = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      if (job.job_type === 'STORE_CREDIT_RECONCILIATION') await expireCredits(db, 100);
      else if (job.job_type === 'LEDGER_RECONCILIATION') await db.query(`select count(*) from trust_financial_ledger_entries where status='PENDING'`);
      else if (job.job_type === 'INVENTORY_RECOVERY') await db.query(`select count(*) from trust_inventory_recovery_actions where status='PENDING'`);
      else if (job.job_type === 'REPLACEMENT_RESERVATION') await db.query(`select count(*) from trust_replacement_orders where status='APPROVED'`);
      else throw new Error(`UNKNOWN_REVERSE_JOB:${job.job_type}`);
      await finish(db, job.id);
      done += 1;
    } catch (error) {
      await fail(db, job, error);
      failed += 1;
    }
  }
  return { surfaceStatus: failed > 0 ? 'DEGRADED' as const : 'LIVE' as const, claimed: jobs.length, done, failed, maxAttempts: MAX_ATTEMPTS };
}

export async function recoverExpiredLeases(db: SqlExecutor) {
  const result = await db.query<any>(`update trust_reverse_commerce_jobs set status='PENDING',lease_until=null,available_at=now(),updated_at=now() where status='PROCESSING' and lease_until<now() returning id`);
  return { recovered: result.rows.length };
}

export async function deadLetterJobs(db: SqlExecutor, limit = 100) {
  const result = await db.query<any>(`select * from trust_reverse_commerce_jobs where status='DEAD' order by updated_at desc limit $1`, [Math.min(Math.max(limit,1),500)]);
  return result.rows;
}
