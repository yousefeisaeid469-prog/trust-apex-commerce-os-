import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const failures=[];
for (const [file, token] of [
  ['deploy/kubernetes/v414/external-effect-recovery-deployment.yaml','external-effect-recovery'],
  ['scripts/external_effect_recovery_daemon.mjs','recoverExpiredExternalEffectsTx'],
  ['scripts/v414_live_integration_lab.mjs','V414 LIVE INTEGRATION LAB'],
]) if(!read(file).includes(token)) failures.push(file);
if(failures.length){console.error('V414 INFRASTRUCTURE AUDIT FAIL',failures);process.exit(1);}
console.log('V414 INFRASTRUCTURE AUDIT PASS');
