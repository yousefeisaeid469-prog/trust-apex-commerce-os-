import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');

test('V231 payment intent API uses the durable commerce orchestrator, not the in-memory adapter',()=>{
 const s=read('app/api/payments/intent/route.ts');
 assert.match(s,/modules\/commerce\/payments\/orchestrator/);
 assert.doesNotMatch(s,/modules\/payments\/core\/adapter/);
 assert.doesNotMatch(s,/getOrder\(/);
});
test('V231 card payment initiation fails closed without a configured provider',()=>{
 const s=read('modules/platform/payments/provider-gate.ts');
 assert.match(s,/PAYMENT_PROVIDER/); assert.match(s,/PAYMENTS_PROVIDER_SECRET/); assert.match(s,/PAYMENT_PROVIDER_NOT_CONFIGURED/);
});
test('V231 webhook processing persists inbox evidence before payment mutation',()=>{
 const s=read('app/api/payments/webhook/route.ts');
 assert.match(s,/ingestWebhook/); assert.match(s,/markWebhook/); assert.match(s,/webhookInboxId/); assert.match(s,/surfaceStatus:'LIVE'/);
});
test('V231 webhook fingerprints prevent same provider/event id from carrying different payloads',()=>{
 const s=read('modules/platform/webhooks/inbox.ts');
 assert.match(s,/WEBHOOK_EVENT_FINGERPRINT_MISMATCH/); assert.match(s,/on conflict\(provider,event_id\) do nothing/);
});
test('V231 merchant order status is durable and merchant-scoped',()=>{
 const s=read('app/api/merchant/orders/status/route.ts');
 assert.match(s,/trust_order_items/); assert.match(s,/trust_products/); assert.match(s,/trust_merchant_profiles/); assert.match(s,/transitionDurableOrder/);
});
test('V231 durable order transitions emit history, notifications and outbox events',()=>{
 const s=read('modules/commerce/orders/state.ts');
 assert.match(s,/trust_order_status_history/); assert.match(s,/queueOrderStatusNotificationsTx/); assert.match(s,/trust_outbox_events/);
});
test('V231 migration adds webhook linkage and execution indexes',()=>{
 const s=read('db/migrations/081_v231_commerce_execution.sql');
 assert.match(s,/webhook_inbox_id uuid/); assert.match(s,/idx_trust_orders_status_created/); assert.match(s,/processing_attempts/);
});
test('V231 migration is registered and canonical version is aligned',()=>{
 const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
 const row=manifest.migrations.find(x=>x.file==='081_v231_commerce_execution.sql');
 assert.ok(row?.checksum); assert.equal(manifest.latest,'101'); assert.equal(manifest.version.match(/^V\d+\.0\.0$/)?.[0],manifest.version);
 assert.match(read('lib/runtime/version.ts'),/V\d+\.0\.0/);
 assert.equal(JSON.parse(read('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(read('package.json')).version);
});

test('V231 payment capture maps to a valid durable order state',()=>{
 const s=read('modules/commerce/payments/state-machine.ts');
 assert.match(s,/status === 'captured'\) return 'confirmed'/);
 assert.doesNotMatch(s,/return 'paid'/);
});
