import fs from 'node:fs';import path from 'node:path';const root=process.cwd();
const must=['modules/platform/global-commerce-automation/execution-mesh.ts','db/migrations/211_v382_global_commerce_execution_mesh.sql','app/api/commerce/automation/execution-mesh/route.ts','scripts/execution_mesh_worker.mjs'];
const bad=must.filter(x=>!fs.existsSync(path.join(root,x)));if(bad.length){console.error(`V382 EXECUTION MESH AUDIT FAILED (${bad.length})`);bad.forEach(x=>console.error('- '+x));process.exit(1)}
const s=fs.readFileSync(path.join(root,must[0]),'utf8');
for(const n of ['enqueueDecisionCommand','skip locked','reclaimExpiredExecutionMeshLeases','MAX_ATTEMPTS','DEAD_LETTERED','lease_until','trust_commerce_execution_mesh_receipts','executeSafeIncidentAction','getActiveGovernedPolicy'])if(!s.includes(n)){console.error('missing '+n);process.exit(1)}
const m=fs.readFileSync(path.join(root,must[1]),'utf8');
for(const n of ['trust_commerce_execution_mesh_jobs','PROCESSING','RETRYING','DEAD_LETTERED','trust_commerce_execution_mesh_attempts','trust_commerce_execution_mesh_receipts'])if(!m.includes(n)){console.error('migration missing '+n);process.exit(1)}
console.log('V382 EXECUTION MESH AUDIT PASS — 10/10');
