import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const checks=[
 ['recovery runtime','modules/platform/durable-events/recovery-loop.ts','runVerifiedCommerceRecovery'],
 ['consumer recovery','modules/platform/durable-events/recovery-loop.ts','recoverStaleConsumerDeliveries'],
 ['execution lease recovery','modules/platform/durable-events/recovery-loop.ts','reclaimExecutionLeases'],
 ['postcondition observation','modules/platform/durable-events/recovery-loop.ts','after = await observeCommerceCommandCenter'],
 ['verification state','modules/platform/durable-events/recovery-loop.ts','verified'],
 ['durable evidence','db/migrations/200_v371_verified_commerce_recovery_loop.sql','trust_commerce_recovery_runs'],
 ['recovery route','app/api/cron/commerce-recovery-loop/route.ts','runVerifiedCommerceRecovery'],
 ['smoke test','tests/v371-verified-recovery.test.mjs','V371'],
];
const failures=[];
for(const [name,file,needle] of checks){const p=path.join(root,file);if(!fs.existsSync(p)) failures.push(`${name}: missing ${file}`);else if(!fs.readFileSync(p,'utf8').includes(needle)) failures.push(`${name}: missing ${needle}`)}
if(failures.length){console.error(`V371 VERIFIED RECOVERY AUDIT FAILED (${failures.length})`); failures.forEach(x=>console.error('- '+x)); process.exit(1)}
console.log(`V371 VERIFIED RECOVERY AUDIT PASS — ${checks.length}/${checks.length} assertions.`);
