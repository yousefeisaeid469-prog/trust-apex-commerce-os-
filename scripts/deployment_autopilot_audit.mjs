import fs from 'node:fs';
const required=['modules/platform/deployment-autopilot/contracts.ts','modules/platform/deployment-autopilot/adapter.ts','modules/platform/deployment-autopilot/gate.ts','modules/platform/deployment-autopilot/controller.ts','modules/platform/deployment-autopilot/evidence.ts','modules/platform/deployment-autopilot/store.ts','db/migrations/036_v146_deployment_autopilot.sql','tests/v146-deployment-autopilot.test.mjs'];
const missing=required.filter(f=>!fs.existsSync(f));
if(missing.length){console.error('TRUST V146 deployment autopilot audit FAILED');missing.forEach(f=>console.error('- '+f));process.exit(1)}
const controller=fs.readFileSync('modules/platform/deployment-autopilot/controller.ts','utf8');
for(const token of ['preflight','canary','freeze','rollback','rollbackVerification','runtimeVerified','evidenceHash'])if(!controller.includes(token)){console.error('Missing control-plane boundary:',token);process.exit(1)}
console.log('TRUST V146 deployment autopilot audit PASS');
