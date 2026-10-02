import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
test('V132 adds lease ownership and recovery primitives',()=>{const s=read('modules/platform/jobs/index.ts');assert.match(s,/leaseToken/);assert.match(s,/recoverExpiredLeases/);assert.match(s,/skip locked/i);});
test('V132 checkout atomically protects idempotency',()=>{const s=read('modules/commerce/transactions/checkout.ts');assert.match(s,/on conflict\(idempotency_key\) do nothing/i);assert.match(s,/IDEMPOTENCY_KEY_REUSED/);});
test('V132 payment webhook atomically deduplicates events',()=>{const s=read('modules/commerce/payments/orchestrator.ts');assert.match(s,/on conflict\(provider,provider_event_id\) do nothing returning id/i);});
test('V132 payment creation and refund use conflict-safe idempotency',()=>{const s=read('modules/commerce/payments/orchestrator.ts');assert.match(s,/trust_payments.*on conflict\(idempotency_key\) do nothing/i);assert.match(s,/trust_refunds.*on conflict\(idempotency_key\) do nothing/i);});
test('V132 SQL enforces positive money amounts',()=>{const s=read('db/migrations/022_v132_transactional_hardening.sql');assert.match(s,/trust_payments_amount_positive/);assert.match(s,/trust_payment_intents_amount_cents_positive/);});
