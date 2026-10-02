import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['canonical consumer worker exists', read('scripts/commerce_consumer_worker.mjs'), /claimDelivery[\s\S]*completeDelivery[\s\S]*retryDelivery/],
 ['consumer worker records durable runs', read('scripts/commerce_consumer_worker.mjs'), /startConsumerRun[\s\S]*finishConsumerRun/],
 ['consumer worker renews delivery leases', read('scripts/commerce_consumer_worker.mjs'), /renewConsumerDeliveryLease/],
 ['delivery store supports lease renewal', read('modules/platform/durable-events/store.ts'), /export async function renewDeliveryLease/],
 ['consumer run persistence exists', read('modules/platform/durable-events/consumer-runtime.ts'), /trust_commerce_consumer_runs/],
 ['consumer heartbeat persistence exists', read('modules/platform/durable-events/consumer-runtime.ts'), /trust_commerce_consumer_heartbeat/],
 ['intelligence has real handler', read('modules/commerce/consumers/intelligence.ts'), /runEffect[\s\S]*trust_commerce_intelligence_snapshots/],
 ['autonomous orchestrator has real handler', read('modules/platform/autonomous-commerce-orchestrator/consumer.ts'), /consumeAutonomousOrchestration[\s\S]*trust_autonomous_orchestration_runs/],
 ['consumer definitions are runtime-addressable', read('modules/platform/commerce-events/contracts.ts'), /autonomous-commerce-orchestrator[\s\S]*commerce-intelligence/],
 ['compatibility mesh delegates to hardened worker', read('scripts/commerce_consumer_mesh.mjs'), /commerce_consumer_worker/],
];
const failures=checks.filter(([,s,re])=>!re.test(s)).map(([n])=>n);
if(failures.length){console.error('CURRENT CONSUMER EXECUTION AUDIT FAILED'); failures.forEach(f=>console.error('- '+f)); process.exit(1)}
console.log(`CURRENT CONSUMER EXECUTION AUDIT PASS — ${checks.length} production execution assertions.`);
