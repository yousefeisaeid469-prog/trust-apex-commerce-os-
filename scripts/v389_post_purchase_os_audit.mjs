import fs from 'node:fs';
const checks=[
 ['post-purchase runtime',fs.existsSync('modules/customer-experience/post-purchase-os.ts')],
 ['post-purchase API',fs.existsSync('app/api/customer/post-purchase/route.ts')],
 ['post-purchase UI',fs.existsSync('app/customer/post-purchase/page.tsx')],
 ['delivered review gate',fs.readFileSync('modules/customer-experience/reviews.ts','utf8').includes("o.status='delivered'" )],
 ['review rejects undelivered',fs.readFileSync('modules/customer-experience/reviews.ts','utf8').includes('REVIEW_REQUIRES_DELIVERED_PURCHASE')],
 ['delivery loyalty idempotency',fs.readFileSync('modules/platform/fulfillment-tracking-3/core.ts','utf8').includes('delivery-loyalty:' )],
 ['loyalty account update',fs.readFileSync('modules/platform/fulfillment-tracking-3/core.ts','utf8').includes('trust_marketplace_loyalty_accounts')],
 ['live order read model',fs.readFileSync('modules/customer-experience/post-purchase-os.ts','utf8').includes('from trust_orders')],
 ['live notifications',fs.readFileSync('modules/customer-experience/post-purchase-os.ts','utf8').includes('from platform_notifications')],
 ['migration 215',fs.existsSync('db/migrations/215_v389_post_purchase_os.sql')],
 ['no demo status',!fs.readFileSync('app/customer/post-purchase/page.tsx','utf8').includes('DEMO')],
 ['package version',JSON.parse(fs.readFileSync('package.json','utf8')).version==='389.0.0'],
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;} if(pass!==checks.length)process.exit(1);console.log(`V389 POST-PURCHASE OS AUDIT PASS — ${pass}/${checks.length}`);
