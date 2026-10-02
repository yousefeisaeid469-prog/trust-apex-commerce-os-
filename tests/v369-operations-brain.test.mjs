import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const root=process.cwd();
test('V369 operations brain is wired to publisher, consumers, execution and durable snapshots',()=>{
 const brain=fs.readFileSync('modules/platform/durable-events/operations-brain.ts','utf8');
 const migration=fs.readFileSync('db/migrations/198_v369_commerce_operations_brain.sql','utf8');
 const health=fs.readFileSync('app/api/health/commerce/control-plane/route.ts','utf8');
 assert.match(brain,/trust_commerce_event_publisher_heartbeat/); assert.match(brain,/getConsumerHealth/); assert.match(brain,/trust_commerce_worker_heartbeat/); assert.match(brain,/recoverStaleConsumerDeliveries/); assert.match(brain,/trust_commerce_execution_jobs/); assert.match(migration,/trust_commerce_operations_snapshots/); assert.match(health,/captureCommerceOperationsSnapshot/);
});
