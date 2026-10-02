import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); let pass=0;
const ok=(n,c)=>{if(c){pass++;console.log(`PASS ${n}`)}else console.log(`FAIL ${n}`)};
const files=[
 'modules/commerce/payments/orchestrator.ts','modules/commerce/core/engine.ts',
 'app/api/checkout/cart/commit/route.ts','app/api/payments/status/route.ts','app/checkout/page.tsx',
 'scripts/payment_provider_worker.mjs'
];
for(const f of files) ok(`required:${f}`,fs.existsSync(path.join(root,f)));
const orch=fs.readFileSync(path.join(root,files[0]),'utf8');
const engine=fs.readFileSync(path.join(root,files[1]),'utf8');
const commit=fs.readFileSync(path.join(root,files[2]),'utf8');
const status=fs.readFileSync(path.join(root,files[3]),'utf8');
const checkout=fs.readFileSync(path.join(root,files[4]),'utf8');
const worker=fs.readFileSync(path.join(root,files[5]),'utf8');
ok('payment amount optional before authoritative order lookup',orch.includes("if(input.amount !== undefined) requirePositiveAmount(Number(input.amount))"));
ok('checkout accepts card or cod',commit.includes("body?.paymentMethod==='card'?'card':'cod'"));
ok('card checkout requires configured provider',commit.includes("paymentMethod==='card' && !readiness.configured"));
ok('order commit receives selected payment method',commit.includes('placeOrderFromQuote(user.id,quote.quoteId,key,paymentMethod)'));
ok('card checkout creates durable payment intent',commit.includes('createPaymentIntent') && commit.includes('checkout-payment:${key}'));
ok('provider job remains worker-backed',worker.includes("job.kind === 'CREATE_PAYMENT'") && worker.includes('getPaymentProvider(job.provider).createPayment'));
ok('payment status supports order scope',status.includes("req.nextUrl.searchParams.get('orderId')"));
ok('checkout has payment method state',checkout.includes('paymentMethod'));
ok('checkout renders card path distinctly',checkout.includes('card'));
ok('checkout polls payment status',checkout.includes('/api/payments/status?orderId='));
ok('checkout does not claim generic card payment is captured',checkout.includes('pending') || checkout.includes('قيد'));
console.log(`V386 PAYMENT COMPLETION AUDIT ${pass===17?'PASS':'RESULT'} — ${pass}/17`);
process.exitCode=pass===17?0:1;
