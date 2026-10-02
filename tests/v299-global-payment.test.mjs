import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const required=[
 'db/migrations/137_v299_global_payment_runtime.sql',
 'modules/platform/global-payment-v299/runtime.ts',
 'modules/commerce/payments/global-runtime.ts',
 'app/api/payments/global/intent/route.ts'
];
for(const f of required) assert.ok(fs.existsSync(f),`missing ${f}`);
const migration=fs.readFileSync(required[0],'utf8');
for(const c of ['trust_global_payment_attempts','payment_method','destination_country','global_payment_attempt_id']) assert.match(migration,new RegExp(c));
const runtime=fs.readFileSync(required[1],'utf8');
assert.match(runtime,/assertGlobalPaymentCapability/); assert.match(runtime,/paymentAdapters/); assert.match(runtime,/V299\.0\.0/);
const flow=fs.readFileSync(required[2],'utf8');
for(const c of ['createPaymentIntent','GLOBAL_PAYMENT_METHOD_MISMATCH','idempotencyKey','global_payment_attempts']) assert.match(flow,new RegExp(c));
const route=fs.readFileSync(required[3],'utf8');
for(const c of ['idempotency-key','requireConfiguredPaymentProvider','V299\.0\.0']) assert.match(route,new RegExp(c));
execFileSync(process.execPath,['--experimental-strip-types','-e',`const m=await import(new URL('modules/platform/global-payment-v299/runtime.ts','file://'+process.cwd()+'/')); const x=m.assertGlobalPaymentCapability({country:'EG',currency:'EGP',method:'card',provider:'TRUST_CARD_ADAPTER'}); if(x.capability!=='CARD') throw new Error('capability'); console.log('V299 capability PASS')`],{stdio:'inherit'});
console.log('V299 global payment contract PASS');
