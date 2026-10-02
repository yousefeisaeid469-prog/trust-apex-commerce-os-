import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const required = [
 'db/migrations/139_v301_global_order_orchestration.sql',
 'modules/platform/global-order-v301/orchestration.ts',
 'modules/platform/global-order-v301/index.ts',
 'app/api/orders/global/[id]/route.ts',
 'modules/commerce/payments/orchestrator.ts'
];
for (const f of required) assert.ok(fs.existsSync(f), `missing ${f}`);
const migration = fs.readFileSync(required[0], 'utf8');
for (const token of ['trust_global_order_orchestrations','global_orchestration_id','FULFILLMENT_PLANNED','SETTLEMENT_RELEASED']) assert.match(migration, new RegExp(token));
const runtime = fs.readFileSync(required[1], 'utf8');
for (const token of ['orchestrateCapturedGlobalOrderTx','createFulfillmentOrderTx','GLOBAL_ORDER_SHIPMENT_PLAN_MISSING','V301.0.0']) assert.match(runtime, new RegExp(token));
const orch = fs.readFileSync(required[4], 'utf8');
assert.match(orch, /orchestrateCapturedGlobalOrderTx/);
execFileSync(process.execPath, ['--experimental-strip-types','-e', `const m=await import(new URL('modules/platform/global-order-v301/orchestration.ts','file://'+process.cwd()+'/')); if(!m.canTransitionGlobalOrder('CAPTURED','FULFILLMENT_PLANNED')) throw new Error('transition'); if(m.canTransitionGlobalOrder('COMPLETED','FULFILLMENT_PLANNED')) throw new Error('terminal'); console.log('V301 state machine PASS')`], {stdio:'inherit'});
console.log('V301 global order orchestration contract PASS');
