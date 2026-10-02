import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['checkout emits durable outbox order event', read('modules/commerce/transactions/checkout.ts'), /trust_outbox_events.*order\.created/s],
 ['event publisher normalizes and appends durable events', read('scripts/commerce_event_publisher.mjs'), /normalizeOutboxEventType[\s\S]*appendEventTx/],
 ['durable event append enqueues subscribers', read('modules/platform/durable-events/tx.ts'), /enqueueSubscribedDeliveriesTx/],
 ['consumer registry contains commerce intelligence', read('modules/platform/commerce-events/contracts.ts'), /commerce-intelligence/],
 ['intelligence consumer invokes Commerce Brain', read('modules/commerce/consumers/intelligence.ts'), /deriveCommerceBrain/],
 ['intelligence consumer invokes Growth Network', read('modules/commerce/consumers/intelligence.ts'), /buildGrowthNetwork/],
 ['intelligence consumer invokes Global Commerce Graph', read('modules/commerce/consumers/intelligence.ts'), /buildGlobalCommerceGraph/],
 ['intelligence consumer invokes Revenue Autopilot', read('modules/commerce/consumers/intelligence.ts'), /buildRevenueAutopilotPlan/],
 ['intelligence consumer invokes Revenue Intelligence', read('modules/commerce/consumers/intelligence.ts'), /estimateRevenueEconomics[\s\S]*buildRevenueScenarios/],
 ['intelligence consumer invokes Commerce Growth OS', read('modules/commerce/consumers/intelligence.ts'), /buildGrowthPlan/],
 ['intelligence consumer invokes Commerce AI Copilot', read('modules/commerce/consumers/intelligence.ts'), /buildCommerceAiCopilot/],
 ['autonomous orchestrator has durable consumer', read('modules/platform/autonomous-commerce-orchestrator/consumer.ts'), /consumeAutonomousOrchestration/],
 ['current wiring persists intelligence snapshots', read('modules/commerce/consumers/intelligence.ts'), /trust_commerce_intelligence_snapshots/],
];
const failures=checks.filter(([,s,re])=>!re.test(s)).map(([name])=>name);
if(failures.length){console.error('CURRENT COMMERCE WIRING AUDIT FAILED'); for(const f of failures) console.error('- '+f); process.exit(1)}
console.log(`CURRENT COMMERCE WIRING AUDIT PASS — ${checks.length} production-chain assertions.`);
for(const [name] of checks) console.log(`PASS ${name}`);
