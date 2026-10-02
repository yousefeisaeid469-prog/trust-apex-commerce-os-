import fs from 'node:fs';
const files=['modules/platform/progressive-delivery/contracts.ts','modules/platform/progressive-delivery/adapter.ts','modules/platform/progressive-delivery/gate.ts','modules/platform/progressive-delivery/controller.ts','modules/platform/progressive-delivery/evidence.ts','modules/platform/progressive-delivery/index.ts','db/migrations/037_v147_progressive_delivery.sql','tests/v147-progressive-delivery.test.mjs'];
const missing=files.filter(f=>!fs.existsSync(f));
if(missing.length){console.error('TRUST V147 progressive delivery audit FAILED');missing.forEach(f=>console.error('- '+f));process.exit(1)}
const c=fs.readFileSync('modules/platform/progressive-delivery/controller.ts','utf8');
for(const needle of ['maxBlastRadiusPct','rollbackObservation','verifyRollback','evidenceHash'])if(!c.includes(needle)){console.error('Missing control: '+needle);process.exit(1)}
console.log('TRUST V147 progressive delivery audit PASS');
