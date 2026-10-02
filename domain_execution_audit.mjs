import fs from 'node:fs';
const required=[
  'modules/commerce/consumers/runtime.ts','modules/commerce/consumers/order.ts','modules/commerce/consumers/payment.ts','modules/commerce/consumers/inventory.ts','modules/commerce/consumers/fulfillment.ts','modules/commerce/consumers/returns.ts','modules/commerce/consumers/notification.ts','modules/commerce/consumers/customer.ts','db/migrations/099_v245_real_domain_execution.sql'
];
for(const f of required){if(!fs.existsSync(f))throw new Error(`MISSING:${f}`);}
for(const f of required.filter(f=>f.includes('/consumers/'))){const s=fs.readFileSync(f,'utf8');if(s.includes('CONSUMER_HANDLER_NOT_WIRED'))throw new Error(`UNWIRED:${f}`);}
const migration=fs.readFileSync('db/migrations/099_v245_real_domain_execution.sql','utf8');
for(const token of ['trust_domain_effects','trust_order_execution_log','trust_return_execution_log'])if(!migration.includes(token))throw new Error(`MISSING_MIGRATION_OBJECT:${token}`);
console.log('V245 domain execution audit: PASS');
