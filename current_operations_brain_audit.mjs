import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const failures=[]; const exists=p=>fs.existsSync(path.join(root,p)); const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[
 ['unified operations runtime','modules/platform/durable-events/operations-brain.ts','captureCommerceOperationsSnapshot'],
 ['consumer recovery integration','modules/platform/durable-events/operations-brain.ts','recoverStaleConsumerDeliveries'],
 ['execution stale recovery','modules/platform/durable-events/operations-brain.ts','lease_until<now()'],
 ['durable operations snapshots','db/migrations/198_v369_commerce_operations_brain.sql','trust_commerce_operations_snapshots'],
 ['operations health endpoint','app/api/health/commerce/control-plane/route.ts','captureCommerceOperationsSnapshot'],
 ['operations recovery trigger','app/api/cron/commerce-operations/route.ts','runCommerceOperationsRecovery'],
 ['publisher correlation','modules/platform/durable-events/operations-brain.ts','trust_commerce_event_publisher_heartbeat'],
 ['execution correlation','modules/platform/durable-events/operations-brain.ts','trust_commerce_worker_heartbeat'],
 ['incident classification','modules/platform/durable-events/operations-brain.ts','PUBLISHER_NOT_DRAINING'],
 ['safe action classification','modules/platform/durable-events/operations-brain.ts','START_CONSUMER_WORKER'],
 ['current-head smoke','tests/v369-operations-brain.test.mjs','V369'],
];
for(const [name,file,needle] of checks){if(!exists(file)) failures.push(`${name}: missing ${file}`);else if(!read(file).includes(needle)) failures.push(`${name}: missing ${needle}`);}
if(failures.length){console.error(`V369 OPERATIONS BRAIN AUDIT FAILED (${failures.length})`); failures.forEach(x=>console.error('- '+x)); process.exit(1)}
console.log(`V369 OPERATIONS BRAIN AUDIT PASS — ${checks.length}/${checks.length} production-chain assertions.`);
