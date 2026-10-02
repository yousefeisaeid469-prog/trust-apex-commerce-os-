import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['migration',/trust_execution_claims/.test(read('db/migrations/237_v412_global_execution_idempotency_mesh.sql'))],
 ['fencing',/fencing_token/.test(read('modules/platform/execution-idempotency.ts'))],
 ['fingerprint',/EXECUTION_FINGERPRINT_MISMATCH/.test(read('modules/platform/execution-idempotency.ts'))],
 ['command-claim',/claimExecutionTx\(tx/.test(read('scripts/command_worker.mjs'))],
 ['commerce-stable-idempotency',/idempotencyKey: `commerce-job:\$\{job\.id\}`/.test(read('modules/commerce/core/execution-worker.ts'))],
];
const failed=checks.filter(x=>!x[1]).map(x=>x[0]);
if(failed.length) throw new Error('V412 TEST FAIL '+failed.join(','));
console.log('V412 EXECUTION IDEMPOTENCY TEST PASS');
