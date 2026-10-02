import fs from 'node:fs';
for (const f of ['app/api/commerce/domain/route.ts','modules/commerce/core/commerce-domain-kernel.ts','db/migrations/240_v415_global_commerce_domain_kernel.sql']) {
  if(!fs.existsSync(f)) throw new Error(`V415_MISSING:${f}`);
}
console.log('V415 DOMAIN SMOKE PASS');
