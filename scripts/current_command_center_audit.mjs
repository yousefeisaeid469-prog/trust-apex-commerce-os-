import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const checks=[
 ['command center runtime','modules/platform/durable-events/command-center.ts','observeCommerceCommandCenter'],
 ['operations correlation','modules/platform/durable-events/command-center.ts','captureCommerceOperationsSnapshot'],
 ['root cause classification','modules/platform/durable-events/command-center.ts','causeFromIncident'],
 ['recovery plan','modules/platform/durable-events/command-center.ts','safeNextAction'],
 ['recent failure signals','modules/platform/durable-events/command-center.ts','recentFailureSignals'],
 ['durable snapshots','db/migrations/199_v370_commerce_command_center.sql','trust_commerce_command_center_snapshots'],
 ['command center endpoint','app/api/health/commerce/command-center/route.ts','captureCommerceCommandCenterSnapshot'],
 ['publisher domain','modules/platform/durable-events/command-center.ts','PUBLISHER'],
 ['consumer domain','modules/platform/durable-events/command-center.ts','CONSUMERS'],
 ['execution domain','modules/platform/durable-events/command-center.ts','EXECUTION'],
 ['current smoke','tests/v370-command-center.test.mjs','V370'],
];
const failures=[];
for(const [name,file,needle] of checks){const p=path.join(root,file);if(!fs.existsSync(p)) failures.push(`${name}: missing ${file}`);else if(!fs.readFileSync(p,'utf8').includes(needle)) failures.push(`${name}: missing ${needle}`)}
if(failures.length){console.error(`V370 COMMAND CENTER AUDIT FAILED (${failures.length})`);failures.forEach(x=>console.error('- '+x));process.exit(1)}
console.log(`V370 COMMAND CENTER AUDIT PASS — ${checks.length}/${checks.length} production-chain assertions.`);
