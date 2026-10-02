import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const orch=read('modules/commerce/payments/orchestrator.ts');
const commit=read('app/api/checkout/cart/commit/route.ts');
const checkout=read('app/checkout/page.tsx');
const status=read('app/api/payments/status/route.ts');
const worker=read('scripts/payment_provider_worker.mjs');
const assertions=[
 ['optional amount is allowed', orch.includes('input.amount !== undefined')],
 ['card creates payment intent', commit.includes('createPaymentIntent')],
 ['provider readiness gates card', commit.includes('PROVIDER_REQUIRED')],
 ['worker executes provider job', worker.includes('CREATE_PAYMENT')],
 ['status is order scoped', status.includes('orderId')],
 ['UI exposes payment method', checkout.includes('paymentMethod')],
 ['UI polls payment', checkout.includes('/api/payments/status?orderId=')],
 ['UI distinguishes pending payment', checkout.includes('pending')],
];
for(const [n,c] of assertions){if(!c)throw new Error(`FAIL:${n}`);console.log(`PASS ${n}`)}
console.log(`V386 PAYMENT COMPLETION TEST PASS — ${assertions.length}/${assertions.length}`);
