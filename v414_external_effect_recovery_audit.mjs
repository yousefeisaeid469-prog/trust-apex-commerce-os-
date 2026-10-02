import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const failures=[];
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='414.0.0') failures.push('package.version');
if(!read('lib/runtime/version.ts').includes("RUNTIME_VERSION='414.0.0'")) failures.push('runtime.version');
if(!read('db/migrations/MANIFEST.json').includes('239_v414_external_effect_recovery_plane.sql')) failures.push('migration.manifest');
if(!read('scripts/payment_provider_worker.mjs').includes("payment-provider-payout")) failures.push('payout.effect');
if(!read('scripts/payment_provider_worker.mjs').includes('failExternalEffectTx')) failures.push('effect.failure');
if(!read('scripts/external_effect_recovery_worker.mjs').includes('recoverExpiredExternalEffectsTx')) failures.push('recovery.worker');
if(failures.length){console.error('V414 EXTERNAL EFFECT RECOVERY AUDIT FAIL',failures);process.exit(1);}
console.log('V414 EXTERNAL EFFECT RECOVERY AUDIT PASS');
