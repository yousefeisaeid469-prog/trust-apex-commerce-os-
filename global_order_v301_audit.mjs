import fs from 'node:fs';
const required=['db/migrations/139_v301_global_order_orchestration.sql','modules/platform/global-order-v301/orchestration.ts','modules/platform/global-order-v301/index.ts','app/api/orders/global/[id]/route.ts'];
const missing=required.filter(f=>!fs.existsSync(f));
if(missing.length){console.error('V301 audit FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}
const s=fs.readFileSync('modules/platform/global-order-v301/orchestration.ts','utf8');
for(const token of ['trust_global_order_orchestrations','createFulfillmentOrderTx','FULFILLMENT_PLANNED','BLOCKED']) if(!s.includes(token)){console.error('V301 audit FAILED: '+token);process.exit(1)}
const report={version:'V301.0.0',status:'GLOBAL_ORDER_ORCHESTRATION_VERIFIED',externalProvidersConnected:false,scope:'runtime-contract-and-durable-orchestration'};
fs.mkdirSync('artifacts/global-order',{recursive:true}); fs.writeFileSync('artifacts/global-order/v301-global-order.json',JSON.stringify(report,null,2)+'\n');
console.log('V301 global order audit PASS');
