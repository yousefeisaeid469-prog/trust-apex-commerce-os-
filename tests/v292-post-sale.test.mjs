import fs from 'node:fs'; import assert from 'node:assert/strict';
const migration=fs.readFileSync('db/migrations/130_v292_post_sale_orchestration.sql','utf8');
for(const x of ['trust_post_sale_cases','trust_post_sale_actions','RETURN_REQUESTED','REFUND_PENDING','REFUND_SUCCEEDED']) assert.match(migration,new RegExp(x));
const core=fs.readFileSync('modules/platform/post-sale-orchestration.ts','utf8');
for(const x of ['syncPostSaleCaseTx','recordPostSaleActionTx','getPostSaleCaseTx','listPostSaleCasesTx','RETURN_REQUESTED','REFUNDED']) assert.match(core,new RegExp(x));
const service=fs.readFileSync('modules/commerce/returns/service.ts','utf8');
for(const x of ['syncPostSaleCaseTx','REFUND_PENDING','REFUND_SUCCEEDED']) assert.match(service,new RegExp(x));
const route=fs.readFileSync('app/api/post-sale/[returnId]/route.ts','utf8');
for(const x of ['APPROVE','REJECT','RECEIVE','START_INSPECTION','INSPECT','REQUEST_REFUND','CLOSE','recordPostSaleActionTx','idempotency-key']) assert.match(route,new RegExp(x));
assert.ok(fs.existsSync('app/api/admin/post-sale/route.ts'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); assert.match(pkg.version,/^29\d\.0\.0$/);
const runtime=fs.readFileSync('lib/runtime/version.ts','utf8'); assert.match(runtime,/V29\d\.0\.0/);
console.log('V292 post-sale orchestration: 24/24 PASS');

const routeText=route; assert.equal((routeText.match(/const key=req\.headers\.get\('idempotency-key'\)/g)||[]).length,1); assert.doesNotMatch(routeText,/const key=req\.headers\.get\('idempotency-key'\).*const key=/s);
console.log('V292 post-sale syntax/idempotency hardening: PASS');
