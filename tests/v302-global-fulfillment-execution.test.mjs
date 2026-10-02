import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const required = [
  'db/migrations/140_v302_global_fulfillment_execution.sql',
  'modules/platform/global-order-v302/execution.ts',
  'modules/platform/global-order-v302/index.ts',
  'modules/platform/fulfillment-tracking-3/core.ts',
  'app/api/orders/global/[id]/fulfillment/route.ts',
];
for (const f of required) assert.ok(fs.existsSync(f), `missing ${f}`);

const migration = fs.readFileSync(required[0], 'utf8');
for (const token of [
  'trust_global_order_execution_runs',
  'delivered_fulfillment_order_count',
  'settlement_released_at',
  'completed_at',
  'uq_global_fulfillment_orchestration_order',
]) assert.match(migration, new RegExp(token));

const runtime = fs.readFileSync(required[1], 'utf8');
for (const token of [
  'completeGlobalDeliveryTx',
  'transitionFulfillmentOrderTx',
  'releaseDeliveredSettlementTx',
  "status='WAITING'",
  'SETTLEMENT_RELEASE_NOT_AVAILABLE',
  'All ${total} global fulfillment orders delivered',
  "'COMPLETED'",
  'V302.0.0',
]) assert.match(runtime, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

const tracking = fs.readFileSync(required[3], 'utf8');
assert.match(tracking, /completeGlobalDeliveryTx/);
assert.match(tracking, /releaseDeliveredSettlementTx/);
assert.doesNotMatch(tracking, /status==='DELIVERED'\?'delivered'/);

const v301 = fs.readFileSync('modules/platform/global-order-v301/orchestration.ts', 'utf8');
assert.match(v301, /FULFILLMENT_PLANNED: \['IN_FULFILLMENT','DELIVERED','BLOCKED','REFUNDED'\]/);
assert.match(v301, /SETTLEMENT_RELEASED: \['COMPLETED','REFUNDED'\]/);
assert.match(v301, /COMPLETED: \['REFUNDED'\]/);
console.log('V302 delivery gate state contract PASS');
console.log('V302 global fulfillment execution contract PASS');
