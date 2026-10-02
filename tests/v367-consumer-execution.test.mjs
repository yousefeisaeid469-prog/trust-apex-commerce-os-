import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const required=[
 'modules/platform/durable-events/consumer-runtime.ts',
 'scripts/commerce_consumer_worker.mjs',
 'scripts/commerce_consumer_mesh.mjs',
 'modules/platform/durable-events/store.ts',
 'modules/commerce/consumers/intelligence.ts',
 'modules/platform/autonomous-commerce-orchestrator/consumer.ts',
 'db/migrations/196_v367_consumer_execution_runtime.sql',
];
for(const f of required) assert.ok(fs.existsSync(path.join(root,f)),`missing ${f}`);
const worker=read('scripts/commerce_consumer_worker.mjs');
const runtime=read('modules/platform/durable-events/consumer-runtime.ts');
const store=read('modules/platform/durable-events/store.ts');
const migration=read('db/migrations/196_v367_consumer_execution_runtime.sql');
for(const token of ['claimDelivery','completeDelivery','retryDelivery','renewConsumerDeliveryLease','startConsumerRun','finishConsumerRun']) assert.match(worker,new RegExp(token),token);
assert.match(runtime,/trust_commerce_consumer_runs/); assert.match(runtime,/trust_commerce_consumer_heartbeat/);
assert.match(store,/renewDeliveryLease/); assert.match(store,/locked_by=\$4/);
assert.match(migration,/trust_commerce_consumer_runs/); assert.match(migration,/trust_commerce_consumer_heartbeat/); assert.match(migration,/idx_trust_event_deliveries_processing_v367/);
assert.match(read('modules/commerce/consumers/intelligence.ts'),/trust_commerce_intelligence_snapshots/);
assert.match(read('modules/platform/autonomous-commerce-orchestrator/consumer.ts'),/trust_autonomous_orchestration_runs/);
console.log('V367 consumer execution runtime: PASS');
