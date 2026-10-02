import { runShipmentReconciliationWorker } from '../modules/platform/fulfillment-providers/execution.ts';
import { query } from '../modules/platform/db/postgres';
const limit=Number(process.env.FULFILLMENT_RECONCILIATION_BATCH||50);
if(!Number.isInteger(limit)||limit<1||limit>500)throw new Error('FULFILLMENT_RECONCILIATION_BATCH_INVALID');
const results=await runShipmentReconciliationWorker(limit);
console.log(JSON.stringify({ok:true,processed:results.length,failed:results.filter(x=>!x.ok).length,results},null,2));
