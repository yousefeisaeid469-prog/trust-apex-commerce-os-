import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V373 order-scoped recovery is evidence-backed and bounded',()=>{
 const runtime=fs.readFileSync('modules/platform/durable-events/reliability-recovery.ts','utf8');
 const migration=fs.readFileSync('db/migrations/202_v373_verified_order_recovery.sql','utf8');
 const route=fs.readFileSync('app/api/commerce/reliability/[orderId]/recover/route.ts','utf8');
 assert.match(runtime,/runVerifiedOrderRecovery/); assert.match(runtime,/materializeCommerceReliabilityTrace/);
 assert.match(runtime,/trust_event_deliveries/); assert.match(runtime,/trust_commerce_execution_jobs/);
 assert.match(runtime,/const after = await materializeCommerceReliabilityTrace\(orderId\)/);
 assert.match(runtime,/trust_commerce_reliability_recovery_runs/);
 assert.match(runtime,/UPDATE trust_event_deliveries/); assert.match(runtime,/UPDATE trust_commerce_execution_jobs/);
 assert.doesNotMatch(runtime,/UPDATE trust_payments/); assert.doesNotMatch(runtime,/UPDATE trust_fulfillment_inventory/);
 assert.match(migration,/trust_commerce_reliability_recovery_runs/);
 assert.match(route,/runVerifiedOrderRecovery/); assert.match(route,/getLatestOrderRecovery/);
});
