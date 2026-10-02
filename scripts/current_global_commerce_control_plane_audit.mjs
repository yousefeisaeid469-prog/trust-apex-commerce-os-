import fs from 'node:fs';
const checks=[
 ['runtime',fs.existsSync('modules/platform/global-commerce-control-plane/core.ts')],
 ['overview-api',fs.existsSync('app/api/commerce/control-plane/route.ts')],
 ['action-api',fs.existsSync('app/api/commerce/control-plane/actions/route.ts')],
 ['surface',fs.existsSync('app/global-commerce-control-plane/page.tsx')],
 ['migration',fs.existsSync('db/migrations/204_v375_global_commerce_control_plane.sql')],
 ['behavioral-test',fs.existsSync('tests/v375-global-commerce-control-plane.test.mjs')],
];
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(checks.some(([,ok])=>!ok)) process.exit(1);
console.log(`V375 GLOBAL COMMERCE CONTROL PLANE ${checks.length}/${checks.length} PASS`);
