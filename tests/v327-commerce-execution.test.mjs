import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migration = fs.readFileSync(path.join(root,'db/migrations/165_v327_commerce_execution_runtime.sql'),'utf8');
const execution = fs.readFileSync(path.join(root,'modules/commerce/core/order-execution.ts'),'utf8');
const payment = fs.readFileSync(path.join(root,'modules/commerce/payments/orchestrator.ts'),'utf8');
const tracking = fs.readFileSync(path.join(root,'modules/platform/fulfillment-tracking-3/core.ts'),'utf8');

for (const token of ['trust_commerce_execution_runs','FULFILLMENT_PLANNED','COMPLETED','settlement_id']) assert.match(migration,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
for (const token of ['startCapturedOrderExecutionTx','prepareOrderFulfillmentTx','transitionFulfillmentOrderTx','releaseDeliveredSettlementTx','completeDeliveredOrderExecutionTx','idempotencyKey']) assert.match(execution,new RegExp(token));
assert.match(payment,/startCapturedOrderExecutionTx\(tx/);
assert.match(tracking,/completeDeliveredOrderExecutionTx\(tx/);
assert.match(execution,/for update/);
assert.match(execution,/on conflict do nothing/);
console.log('V327 commerce execution source tests PASS');
