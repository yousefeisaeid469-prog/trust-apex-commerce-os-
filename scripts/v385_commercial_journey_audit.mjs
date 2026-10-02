import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
 'modules/commerce/journey/commercial-journey.ts',
 'app/api/commerce/journey/route.ts',
 'app/cart/page.tsx',
 'app/checkout/page.tsx',
 'modules/commerce/cart/store.ts',
 'app/api/checkout/cart/route.ts',
 'app/api/checkout/cart/commit/route.ts',
];
let pass=0;
function ok(name,cond){if(cond){pass++;console.log(`PASS ${name}`)}else console.log(`FAIL ${name}`)}
for(const f of required) ok(`required:${f}`,fs.existsSync(path.join(root,f)));
const journey=fs.readFileSync(path.join(root,'modules/commerce/journey/commercial-journey.ts'),'utf8');
const cart=fs.readFileSync(path.join(root,'app/cart/page.tsx'),'utf8');
const checkout=fs.readFileSync(path.join(root,'app/checkout/page.tsx'),'utf8');
ok('journey reads authoritative cartSummary',journey.includes('cartSummary(customerId)'));
ok('journey exposes blockers from invalid/stale cart',journey.includes("cart.invalidLines > 0 || cart.stockWarnings.length > 0"));
ok('cart uses canonical journey endpoint',cart.includes("fetch('/api/commerce/journey'"));
ok('cart updates canonical cart API',cart.includes("fetch('/api/cart/items'"));
ok('checkout creates server quote',checkout.includes("fetch('/api/checkout/cart'"));
ok('checkout commits through canonical cart checkout',checkout.includes("fetch('/api/checkout/cart/commit'"));
ok('checkout uses idempotency key',checkout.includes("idempotency-key"));
ok('checkout explicitly reflects current COD path',checkout.includes('الدفع عند الاستلام'));
console.log(`V385 COMMERCIAL JOURNEY AUDIT ${pass===15?'PASS':'RESULT'} — ${pass}/15`);
process.exitCode=pass===15?0:1;
