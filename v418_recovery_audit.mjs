import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const [engine,worker,route,mig,deploy]=await Promise.all([
 readFile('modules/commerce/core/recovery-engine.ts','utf8'),readFile('scripts/v418_recovery_engine_worker.mjs','utf8'),readFile('app/api/runtime/recovery-engine/route.ts','utf8'),readFile('db/migrations/243_v418_global_commerce_recovery_engine.sql','utf8'),readFile('deploy/kubernetes/v418/recovery-engine-deployment.yaml','utf8')]);
assert(engine.includes('refreshCommerceExecutionGraphTx'));
assert(engine.includes('enqueueCommerceExecutionJobTx'));
assert(engine.includes('on conflict(idempotency_key)'));
assert(engine.includes('max_attempts'));
assert(worker.includes('skip locked'));
assert(worker.includes('reconcileCommerceOrderTx'));
assert(route.includes('recoveryEngineSnapshot'));
assert(route.includes('getCurrentUser'));
assert(route.includes("'admin','operations'"));
assert(mig.includes('CREATE TABLE IF NOT EXISTS trust_commerce_recovery_plans'));
assert(deploy.includes('scripts/v418_recovery_engine_worker.mjs'));
assert(deploy.includes('trust-database'));
console.log('V418 RECOVERY ENGINE AUDIT PASS');
