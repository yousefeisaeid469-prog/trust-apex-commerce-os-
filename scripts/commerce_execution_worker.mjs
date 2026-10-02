import { randomUUID } from 'node:crypto';
import { query, withPgTransaction, databaseConfigured } from '../modules/platform/db/postgres.ts';
import { runCommerceExecutionWorker, recoverExpiredCommerceExecutionLeases } from '../modules/commerce/core/execution-worker.ts';
import { startWorker, heartbeatWorker, finishWorker } from '../modules/platform/worker-plane.ts';
import { acquireWorkerSlot, releaseWorkerSlot } from '../modules/platform/worker-scheduler.ts';

const once = process.argv.includes('--once');
const batch = Number(process.env.TRUST_COMMERCE_EXECUTION_BATCH ?? 10);
const idleMs = Number(process.env.TRUST_COMMERCE_EXECUTION_IDLE_MS ?? 1000);
if (!Number.isInteger(batch) || batch < 1 || batch > 100) throw new Error('TRUST_COMMERCE_EXECUTION_BATCH_INVALID');

const db = {
  query,
  transaction: withPgTransaction,
};

async function tick() {
  if (!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
  const recovered = await recoverExpiredCommerceExecutionLeases(db);
  const result = await runCommerceExecutionWorker(db, { limit: batch });
  return { recovered: recovered.recovered, ...result };
}

const workerId = process.env.TRUST_COMMERCE_EXECUTION_WORKER_ID ?? `commerce-execution-${process.pid}-${randomUUID()}`;
const worker = await startWorker('commerce-execution', { workerId, metadata: { batch, idleMs } });
try {
  if (once) {
    const slot=await acquireWorkerSlot('commerce-execution',worker.workerId,worker.leaseSeconds);
    if(!slot){ await finishWorker(worker,'DRAINED',{counters:{claimed:0,recovered:0}}); process.exit(0); }
    try { const result = await tick();
      await heartbeatWorker(worker,{claimed:result.claimed,recovered:result.recovered});
      await releaseWorkerSlot(slot);
      await finishWorker(worker,'SUCCEEDED',{counters:{claimed:result.claimed,recovered:result.recovered}});
      console.log(JSON.stringify({ ...result, workerId }, null, 2));
      process.exit(0);
    } finally {}
    await finishWorker(worker,'SUCCEEDED',{counters:{claimed:result.claimed,recovered:result.recovered}});
    console.log(JSON.stringify({ ...result, workerId }, null, 2));
    process.exit(0);
  }
  while (true) {
    const slot=await acquireWorkerSlot('commerce-execution',worker.workerId,worker.leaseSeconds);
    if(!slot){ await new Promise(resolve=>setTimeout(resolve,Math.min(idleMs,1000))); continue; }
    const result = await tick();
    await heartbeatWorker(worker,{claimed:result.claimed,recovered:result.recovered,succeeded:result.succeeded,failed:result.failed});
    await releaseWorkerSlot(slot);
    if (result.claimed === 0 && result.recovered === 0) await new Promise(resolve => setTimeout(resolve, idleMs));
  }
} catch(error) {
  const message=error instanceof Error?error.message:String(error);
  try { await finishWorker(worker,'FAILED',{errorCode:'COMMERCE_EXECUTION_WORKER_FAILED',errorMessage:message}); } catch {}
  throw error;
}
