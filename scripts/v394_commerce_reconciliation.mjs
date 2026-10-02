import { withPgTransaction, query, closePostgresPool } from '../modules/platform/db/postgres.ts';
import { findCommerceReconciliationCandidatesTx, reconcileCommerceCandidateTx } from '../modules/commerce/core/reconciliation.ts';

const limit = Math.max(1, Math.min(100, Number(process.env.RECONCILIATION_BATCH_SIZE ?? 25)));
const dryRun = process.env.RECONCILIATION_DRY_RUN === 'true';

async function main() {
  if (!process.env.DATABASE_URL && !process.env.TRUST_DB_URL) {
    console.log(JSON.stringify({version:'V394.0.0',suite:'commerce-reconciliation',status:'SKIP',reason:'DATABASE_NOT_CONFIGURED',message:'Set DATABASE_URL/TRUST_DB_URL to run against real PostgreSQL.'}, null, 2));
    return;
  }

  const candidates = await withPgTransaction(client => findCommerceReconciliationCandidatesTx(client, limit));
  const results = [];
  for (const candidate of candidates) {
    if (dryRun) {
      results.push({candidate,action:'DRY_RUN'});
      continue;
    }
    try {
      const result = await withPgTransaction(async client => {
        const lock = await client.query(`select pg_try_advisory_xact_lock(hashtext($1)) locked`, [`commerce.reconciliation:${candidate.orderId}`]);
        if (!lock.rows[0]?.locked) return {skipped:true,reason:'LOCK_BUSY'};
        return reconcileCommerceCandidateTx(client, candidate, `reconcile:${candidate.kind}:${candidate.orderId}`);
      });
      results.push({candidate,result});
    } catch (error) {
      results.push({candidate,error:error instanceof Error ? error.message : 'RECONCILIATION_FAILED'});
    }
  }

  const failed = results.filter(x => x.error).length;
  console.log(JSON.stringify({version:'V394.0.0',suite:'commerce-reconciliation',status:failed ? 'PARTIAL' : 'PASS',dryRun,candidateCount:candidates.length,processed:results.length,failed,results}, null, 2));
  if (failed) process.exitCode = 2;
}

try { await main(); } finally { await closePostgresPool(); }
