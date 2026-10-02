import fs from 'node:fs';
const files=['modules/platform/global-deployment-control/contracts.ts','modules/platform/global-deployment-control/adapter.ts','modules/platform/global-deployment-control/gate.ts','modules/platform/global-deployment-control/controller.ts','modules/platform/global-deployment-control/evidence.ts','modules/platform/global-deployment-control/index.ts','db/migrations/038_v148_global_deployment_control_plane.sql','tests/v148-global-deployment-control.test.mjs'];
const missing=files.filter(f=>!fs.existsSync(f));
if(missing.length){console.error('TRUST V148 global deployment audit FAILED');missing.forEach(f=>console.error('- '+f));process.exit(1)}
const c=fs.readFileSync('modules/platform/global-deployment-control/controller.ts','utf8'); const g=fs.readFileSync('modules/platform/global-deployment-control/gate.ts','utf8');
for(const needle of ['requireSequentialRegions','maxRegionalBlastRadiusPct','rollbackRegion','verifyRecovery','evidenceHash'])if(!c.includes(needle)){console.error('Missing control: '+needle);process.exit(1)}
if(!g.includes('dependencyHealthy')){console.error('Missing control: dependencyHealthy');process.exit(1)}
console.log('TRUST V148 global deployment audit PASS');
