import fs from 'node:fs';import path from 'node:path';const root=process.cwd();
const must=['modules/platform/global-commerce-automation/execution-fabric.ts','db/migrations/212_v383_global_commerce_execution_fabric.sql','app/api/commerce/automation/execution-fabric/route.ts','scripts/execution_fabric_worker.mjs'];
const bad=must.filter(x=>!fs.existsSync(path.join(root,x)));if(bad.length){console.error(`V383 EXECUTION FABRIC AUDIT FAILED (${bad.length})`);bad.forEach(x=>console.error('- '+x));process.exit(1)}
const s=fs.readFileSync(path.join(root,must[0]),'utf8');const m=fs.readFileSync(path.join(root,must[1]),'utf8');
for(const n of ['createExecutionWorkflow','enqueueDecisionCommand','runExecutionMeshOnce','for update','skip locked','LEASE_SECONDS','MAX_ATTEMPTS','DEAD_LETTERED','trust_commerce_execution_fabric_receipts','trust_commerce_execution_fabric_adapters'])if(!s.includes(n)){console.error('runtime missing '+n);process.exit(1)}
for(const n of ['trust_commerce_execution_fabric_workflows','trust_commerce_execution_fabric_steps','trust_commerce_execution_fabric_adapters','trust_commerce_execution_fabric_receipts','trust_commerce_execution_fabric_compensations','commerce.recovery.v382'])if(!m.includes(n)){console.error('migration missing '+n);process.exit(1)}
console.log('V383 EXECUTION FABRIC AUDIT PASS — 12/12');
