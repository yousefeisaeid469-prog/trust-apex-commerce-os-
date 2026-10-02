import fs from 'node:fs';
const checks=[
 ['runtime',fs.existsSync('modules/platform/global-commerce-incident-orchestrator/core.ts')],
 ['api',fs.existsSync('app/api/commerce/incidents/route.ts')],
 ['action-api',fs.existsSync('app/api/commerce/incidents/actions/route.ts')],
 ['surface',fs.existsSync('app/global-commerce-incidents/page.tsx')],
 ['migration',fs.existsSync('db/migrations/205_v376_commerce_incident_orchestrator.sql')],
 ['test',fs.existsSync('tests/v376-commerce-incident-orchestrator.test.mjs')]
];
for(const [n,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${n}`);
if(checks.some(([,ok])=>!ok)) process.exit(1);
console.log(`V376 COMMERCE INCIDENT ORCHESTRATOR ${checks.length}/${checks.length} PASS`);
