import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'modules/platform/durable-events/tx.ts',
  'scripts/commerce_event_publisher.mjs',
  'db/migrations/097_v243_distributed_commerce_runtime.sql',
  'tests/v243-distributed-commerce.test.mjs',
];
const errors=[];
for (const file of required) if(!fs.existsSync(path.join(root,file))) errors.push(`Missing ${file}`);
const publisher=fs.readFileSync(path.join(root,'scripts/commerce_event_publisher.mjs'),'utf8');
for(const token of ['FOR UPDATE SKIP LOCKED','appendEventTx','enqueueSubscribedDeliveriesTx','status=\'published\'','status=\'failed\'']) if(!publisher.includes(token)) errors.push(`Publisher missing ${token}`);
const registry=fs.readFileSync(path.join(root,'modules/platform/commerce-events/registry.ts'),'utf8');
if(!registry.includes('trust_event_deliveries')) errors.push('Registry missing trust_event_deliveries persistence');
const tx=fs.readFileSync(path.join(root,'modules/platform/durable-events/tx.ts'),'utf8');
for(const token of ['pg_advisory_xact_lock','idempotency_key','trust_commerce_events']) if(!tx.includes(token)) errors.push(`Transactional event append missing ${token}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('V243 distributed commerce audit: PASS');
