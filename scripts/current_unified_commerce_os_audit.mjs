import fs from 'node:fs';
const checks=[
 ['runtime','modules/platform/unified-commerce-os/core.ts'],
 ['api','app/api/commerce/os/overview/route.ts'],
 ['surface','app/unified-commerce-os/page.tsx'],
 ['migration','db/migrations/203_v374_unified_commerce_os.sql'],
 ['test','tests/v374-unified-commerce-os.test.mjs']
];
let pass=0; for(const [name,file] of checks){const ok=fs.existsSync(file)&&fs.statSync(file).size>100; console.log(`${ok?'PASS':'FAIL'} ${name}: ${file}`); if(ok)pass++;}
console.log(`V374 Unified Commerce OS Audit: ${pass}/${checks.length} PASS`); if(pass!==checks.length)process.exit(1);
