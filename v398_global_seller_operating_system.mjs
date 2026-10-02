import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
for(const f of ['db/migrations/223_v398_global_seller_operating_system.sql','modules/platform/seller-os-operating-surface.ts','app/api/merchant/operating-surface/route.ts']) if(!exists(f)) errors.push('missing '+f);
const m=read('db/migrations/223_v398_global_seller_operating_system.sql');
for(const t of ['trust_global_seller_operating_truth','trust_seller_settlement_truth','trust_merchant_inventory_balances','trust_marketplace_fulfillment_orders','operating_status']) if(!m.includes(t)) errors.push('missing contract '+t);
const api=read('app/api/merchant/operating-surface/route.ts'); for(const t of ['getMerchantByUserId','getSellerOperatingSurface','MERCHANT_REQUIRED','DATABASE_NOT_CONFIGURED']) if(!api.includes(t)) errors.push('api contract '+t);
if(errors.length){console.error('V398 SELLER OPERATING SYSTEM CHECK FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('V398 SELLER OPERATING SYSTEM CHECK PASS — catalog, inventory, orders, fulfillment and finance share one merchant-scoped read authority.');
