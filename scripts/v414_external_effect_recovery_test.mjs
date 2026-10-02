import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['recovery migration',read('db/migrations/239_v414_external_effect_recovery_plane.sql').includes('trust_external_effect_recovery_snapshot')],
 ['lease recovery function',read('modules/platform/transaction-consistency.ts').includes('recoverExpiredExternalEffectsTx')],
 ['provider payout effect',read('scripts/payment_provider_worker.mjs').includes("payment-provider-payout")],
 ['explicit effect failure',read('scripts/payment_provider_worker.mjs').includes('failExternalEffectTx')],
 ['recovery worker',read('scripts/external_effect_recovery_worker.mjs').includes('recoverExpiredExternalEffectsTx')],
 ['recovery api',read('app/api/runtime/external-effects/route.ts').includes('staleExecuting')],
];
if(checks.some(([,ok])=>!ok)){console.error('V414 EXTERNAL EFFECT RECOVERY TEST FAIL',checks.filter(([,ok])=>!ok));process.exit(1);}
console.log('V414 EXTERNAL EFFECT RECOVERY TEST PASS');
