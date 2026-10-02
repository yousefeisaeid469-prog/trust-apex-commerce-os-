import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
test('current runtime version is canonical',()=>{assert.match(read('lib/runtime/version.ts'),/V\d+\.0\.0/);assert.equal(JSON.parse(read('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(read('package.json')).version);});
test('V134 idempotency binds replay to request hash',()=>{const s=read('modules/platform/persistence/transaction-store.ts');assert.match(s,/IDEMPOTENCY_KEY_REUSED/);assert.match(s,/request_hash/);assert.match(s,/stableJson/);});
test('V134 refund request does not settle payment early',()=>{const s=read('modules/commerce/payments/orchestrator.ts');const request=s.slice(s.indexOf('export async function requestRefund'),s.indexOf('export async function applyRefundEvent'));assert.doesNotMatch(request,/update trust_payments set status=.*refunded/i);assert.match(s,/export async function applyRefundEvent/);});
test('V134 releases reserved inventory on pre-fulfillment payment failure',()=>{const s=read('modules/commerce/payments/orchestrator.ts');assert.match(s,/trust_inventory_reservations/);assert.match(s,/payment_failed_release/);});
test('V134 has acquisition evidence model',()=>{const s=read('db/migrations/024_v134_acquisition_integrity.sql');assert.match(s,/trust_release_evidence/);assert.match(s,/trust_incident_events/);});
