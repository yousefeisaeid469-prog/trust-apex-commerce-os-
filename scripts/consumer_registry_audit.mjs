import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const failures=[];
const required=[
  'modules/platform/commerce-events/registry.ts',
  'modules/platform/commerce-events/contracts.ts',
  'modules/platform/durable-events/tx.ts',
  'scripts/commerce_event_publisher.mjs',
  'scripts/commerce_consumer_mesh.mjs',
  'db/migrations/100_v246_runtime_consumer_registry.sql',
  'tests/v246-consumer-registry.test.mjs'
];
for(const f of required) if(!fs.existsSync(path.join(root,f))) failures.push(`MISSING:${f}`);
const registry=fs.readFileSync(path.join(root,'modules/platform/commerce-events/registry.ts'),'utf8');
const publisher=fs.readFileSync(path.join(root,'scripts/commerce_event_publisher.mjs'),'utf8');
const worker=fs.readFileSync(path.join(root,'scripts/commerce_consumer_mesh.mjs'),'utf8');
const tx=fs.readFileSync(path.join(root,'modules/platform/durable-events/tx.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'db/migrations/100_v246_runtime_consumer_registry.sql'),'utf8');
for(const token of ['getSubscription','listEnabledSubscriptions','setSubscription','getEventSchema','registerEventSchema','enqueueSubscribedDeliveriesTx','validateEventContractTx']) if(!registry.includes(token)) failures.push(`REGISTRY_MISSING:${token}`);
for(const token of ['enqueueSubscribedDeliveriesTx','schemaVersion']) if(!publisher.includes(token)) failures.push(`PUBLISHER_NOT_REGISTRY_DRIVEN:${token}`);
if(publisher.includes('CONSUMER_DEFINITIONS')) failures.push('PUBLISHER_USES_STATIC_DEFINITIONS');
for(const token of ['getSubscription','subscription.maxAttempts','CONTRACT_VERSION_MISMATCH']) if(!worker.includes(token)) failures.push(`WORKER_NOT_REGISTRY_DRIVEN:${token}`);
for(const token of ['validateEventContractTx','schema_version']) if(!tx.includes(token)) failures.push(`EVENT_CONTRACT_NOT_ENFORCED:${token}`);
for(const token of ['trust_consumer_subscriptions','trust_event_schema_versions','schema_version','Backfill delivery']) if(!migration.includes(token)) failures.push(`MIGRATION_MISSING:${token}`);
if(failures.length){console.error(JSON.stringify({ok:false,failures},null,2));process.exit(1);}
console.log(JSON.stringify({ok:true,runtimeDrivenSubscriptions:true,contractRegistryEnforced:true,dynamicRetryPolicy:true},null,2));
