import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contracts = fs.readFileSync(path.join(root, 'modules/platform/commerce-events/contracts.ts'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'scripts/commerce_consumer_mesh.mjs'), 'utf8');
const required = ['order','payment','inventory','fulfillment','returns','notification','customer'];
const failures = [];
for (const id of required) {
  const file = path.join(root, `modules/commerce/consumers/${id}.ts`);
  if (!fs.existsSync(file)) failures.push(`MISSING_HANDLER:${id}`);
  if (!contracts.includes(`id: '${id}'`)) failures.push(`MISSING_DEFINITION:${id}`);
}
if (!worker.includes('claimDelivery') || !worker.includes('completeDelivery') || !worker.includes('retryDelivery')) failures.push('WORKER_NOT_DURABLE');
if (worker.includes("return { status: 'PROCESSED' }")) failures.push('UNSAFE_AUTO_SUCCESS');
if (failures.length) { console.error(JSON.stringify({ ok:false, failures }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok:true, consumers:required.length, durable_claims:true, explicit_success_required:true }, null, 2));
