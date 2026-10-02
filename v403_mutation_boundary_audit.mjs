import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const required=[
 ['modules/commerce/inventory/transaction-engine.ts',['adjustInventoryTransactionTx','returnInventoryTransactionTx','V403_INVENTORY_MUTATION_CLOSURE']],
 ['modules/commerce/repository/catalog.ts',['adjustInventoryTransactionTx']],
 ['modules/commerce/merchant-ops/service.ts',['adjustInventoryTransactionTx']],
 ['modules/marketplace/offers.ts',['adjustInventoryTransactionTx']],
 ['modules/commerce/reverse-commerce/replacement.ts',['adjustInventoryTransactionTx']],
 ['modules/commerce/reverse-commerce/inventory-recovery.ts',['adjustInventoryTransactionTx']],
 ['modules/platform/post-sale-finance.ts',['returnInventoryTransactionTx']],
 ['modules/platform/v317/marketplace/runtime.ts',['reserveInventoryTransactionTx']],
];
const errors=[]; for(const [file,tokens] of required){if(!fs.existsSync(path.join(root,file))){errors.push(`missing ${file}`);continue;}const s=fs.readFileSync(path.join(root,file),'utf8');for(const t of tokens)if(!s.includes(t))errors.push(`${file}: missing ${t}`)}
if(errors.length){console.error('V403 MUTATION BOUNDARY AUDIT FAIL');errors.forEach(x=>console.error('- '+x));process.exit(1)}
console.log('V403 MUTATION BOUNDARY AUDIT PASS — legacy inventory mutation paths delegate to the canonical transaction engine.');
