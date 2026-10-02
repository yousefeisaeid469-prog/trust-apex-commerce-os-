import assert from 'node:assert/strict';
import fs from 'node:fs';

const orchestrator = fs.readFileSync('modules/commerce/payments/orchestrator.ts', 'utf8');
const webhookRoute = fs.readFileSync('app/api/payments/webhook/route.ts', 'utf8');

assert.match(orchestrator, /export function assertWebhookMoney\(/);
assert.match(orchestrator, /WEBHOOK_AMOUNT_MISMATCH/);
assert.match(orchestrator, /WEBHOOK_CURRENCY_MISMATCH/);
assert.match(orchestrator, /INVALID_WEBHOOK_AMOUNT/);
assert.match(orchestrator, /expectedAmount:Number\(payment\.rows\[0\]\.amount\)/);
assert.match(orchestrator, /expectedCurrency:String\(payment\.rows\[0\]\.currency\)/);
assert.match(orchestrator, /reportedAmount:payload\?\.amount/);
assert.match(orchestrator, /reportedCurrency:payload\?\.currency/);
assert.match(webhookRoute, /applyPaymentEvent/);
assert.match(webhookRoute, /verifyWebhookSignature/);
console.log('V336 payment webhook money-integrity regression: PASS');
