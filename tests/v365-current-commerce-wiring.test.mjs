import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');

test('V365 checkout -> outbox -> publisher -> durable event -> deliveries is wired',()=>{
  const checkout=read('modules/commerce/transactions/checkout.ts');
  const publisher=read('scripts/commerce_event_publisher.mjs');
  const tx=read('modules/platform/durable-events/tx.ts');
  assert.match(checkout,/trust_outbox_events[\s\S]*order\.created/);
  assert.match(publisher,/normalizeOutboxEventType/);
  assert.match(publisher,/appendEventTx/);
  assert.match(tx,/enqueueSubscribedDeliveriesTx/);
});

test('V365 intelligence modules have production consumer callers, not only pages',()=>{
  const consumer=read('modules/commerce/consumers/intelligence.ts');
  for(const token of ['deriveCommerceBrain','buildGrowthNetwork','buildGlobalCommerceGraph','buildRevenueAutopilotPlan','estimateRevenueEconomics','buildRevenueScenarios','buildGrowthPlan','buildCommerceAiCopilot']) assert.match(consumer,new RegExp(token));
  assert.match(consumer,/trust_commerce_intelligence_snapshots/);
});

test('V365 autonomous orchestrator has a durable consumer entrypoint',()=>{
  const consumer=read('modules/platform/autonomous-commerce-orchestrator/consumer.ts');
  assert.match(consumer,/consumeAutonomousOrchestration/);
  assert.match(consumer,/trust_autonomous_orchestration_runs/);
});
