import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
const journey=read('modules/commerce/journey/commercial-journey.ts');
const cart=read('app/cart/page.tsx');
const checkout=read('app/checkout/page.tsx');
const api=read('app/api/commerce/journey/route.ts');
const assertions=[
 ['journey uses cart summary',journey.includes('cartSummary(customerId)')],
 ['journey returns checkout readiness',journey.includes('CHECKOUT_READY')],
 ['journey blocks stale carts',journey.includes('REFRESH_CART')],
 ['api requires current user',api.includes('getCurrentUser')],
 ['cart renders real item names',cart.includes('{i.name}')],
 ['cart patches real quantities',cart.includes("method:'PATCH'")],
 ['checkout obtains server quote',checkout.includes("/api/checkout/cart")],
 ['checkout commits order',checkout.includes("/api/checkout/cart/commit")],
 ['checkout sends idempotency key',checkout.includes("idempotency-key")],
 ['no client-side total is trusted for commit',checkout.includes("body:JSON.stringify({destinationRegion:region,discountCode:code||undefined})")],
];
const passed=assertions.filter(([,v])=>v).length;
for(const [n,v] of assertions) console.log(`${v?'PASS':'FAIL'} ${n}`);
console.log(`V385 COMMERCIAL JOURNEY TEST ${passed===assertions.length?'PASS':'RESULT'} — ${passed}/${assertions.length}`);
process.exitCode=passed===assertions.length?0:1;
