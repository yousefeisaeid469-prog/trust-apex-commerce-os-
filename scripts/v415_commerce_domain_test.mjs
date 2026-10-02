import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['kernel module',read('modules/commerce/core/commerce-domain-kernel.ts').includes("V415.0.0")],
 ['journey view',read('db/migrations/240_v415_global_commerce_domain_kernel.sql').includes('trust_commerce_domain_snapshot')],
 ['payment truth',read('db/migrations/240_v415_global_commerce_domain_kernel.sql').includes('latest_payment')],
 ['execution truth',read('db/migrations/240_v415_global_commerce_domain_kernel.sql').includes('latest_execution')],
 ['runtime truth',read('db/migrations/240_v415_global_commerce_domain_kernel.sql').includes('latest_runtime')],
 ['cart truth',read('db/migrations/240_v415_global_commerce_domain_kernel.sql').includes('cart_line_count')],
 ['api surface',read('app/api/commerce/domain/route.ts').includes('commerceDomainSnapshot')],
];
if(checks.some(([,ok])=>!ok)){console.error('V415 COMMERCE DOMAIN TEST FAIL',checks.filter(([,ok])=>!ok));process.exit(1)}
console.log('V415 COMMERCE DOMAIN TEST PASS');
