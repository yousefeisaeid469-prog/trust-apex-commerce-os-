import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const failures=[];
const kernel=read('modules/commerce/core/canonical-commerce-kernel.ts');
const engine=read('modules/commerce/core/engine.ts');
const globalRoute=read('app/api/checkout/global/commit/route.ts');
const migration=read('db/migrations/241_v416_canonical_commerce_execution_path.sql');
if(!kernel.includes("CANONICAL_COMMERCE_CONTRACT_VERSION = 'V416.0.0'")) failures.push('canonical contract missing');
if(!kernel.includes('recordCanonicalCommit')) failures.push('receipt writer missing');
if(!engine.includes('commitCanonicalCheckout')) failures.push('local checkout bypass');
if(!globalRoute.includes('commitCanonicalGlobalCheckout')) failures.push('global checkout bypass');
if(globalRoute.includes("modules/commerce/transactions/global-checkout")) failures.push('global route imports legacy transaction');
if(engine.includes("../transactions/checkout")) failures.push('engine imports legacy transaction');
if(!migration.includes('trust_commerce_execution_receipts')) failures.push('receipt table missing');
if(!migration.includes('UNIQUE(surface,idempotency_key)')) failures.push('receipt uniqueness missing');
if(failures.length){console.error('V416 CANONICAL EXECUTION TEST FAIL', failures);process.exit(1)}
console.log('V416 CANONICAL EXECUTION TEST PASS');
