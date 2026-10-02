import fs from 'node:fs';
const required=['modules/platform/production-reliability/contracts.ts','modules/platform/production-reliability/runtime.ts','modules/platform/production-reliability/controller.ts','modules/platform/production-reliability/candidate.ts','modules/platform/production-reliability/evidence.ts','db/migrations/035_v145_production_reliability_integration.sql','tests/v145-production-reliability.test.mjs'];
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('TRUST V145 production reliability audit FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}
const loop=fs.readFileSync('modules/platform/autonomous-reliability-loop/loop.ts','utf8'); if(!loop.includes('rollbackResult')||!loop.includes('postRollbackVerified')){console.error('Rollback verification boundary missing');process.exit(1)}
console.log('TRUST V145 production reliability audit PASS');
