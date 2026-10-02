import assert from 'node:assert/strict';
import fs from 'node:fs';

const orchestrator = fs.readFileSync('modules/commerce/payments/orchestrator.ts', 'utf8');
const intentRoute = fs.readFileSync('app/api/payments/intent/route.ts', 'utf8');
const paymentRoute = fs.readFileSync('app/api/payments/route.ts', 'utf8');

assert.match(orchestrator, /select total,status,customer_id,currency from trust_orders where id=\$1 for update/);
assert.match(orchestrator, /const amount=Number\(order\.rows\[0\]\.total\)/);
assert.match(orchestrator, /input\.amount !== undefined/);
assert.match(orchestrator, /PAYMENT_AMOUNT_MISMATCH/);
assert.match(orchestrator, /const currency=String\(order\.rows\[0\]\.currency\)\.toUpperCase\(\)/);
assert.match(intentRoute, /if\(!b\?\.orderId\|\|!provider\)/);
assert.doesNotMatch(intentRoute, /Number\(b\.amount\)/);
assert.doesNotMatch(paymentRoute, /Number\(b\.amount\)/);
assert.match(paymentRoute, /intentCreation: false/);
console.log('V333 payment amount authority regression: PASS');
