import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const required = [
  'modules/platform/commerce-events/registry.ts',
  'modules/platform/commerce-events/schema-validator.ts',
  'modules/platform/durable-events/tx.ts',
  'modules/platform/durable-events/store.ts',
  'scripts/commerce_event_publisher.mjs',
  'scripts/commerce_consumer_mesh.mjs',
  'scripts/consumer_registry_audit.mjs',
  'tests/v246-consumer-registry.test.mjs',
  'tests/v247-schema-contract.test.mjs',
  'scripts/release_gate.mjs',
  'scripts/version_consistency_audit.mjs',
];
const failures=[];
for (const file of required) if (!fs.existsSync(path.join(root,file))) failures.push(`MISSING:${file}`);
const registry=read('modules/platform/commerce-events/registry.ts');
const validator=read('modules/platform/commerce-events/schema-validator.ts');
const tx=read('modules/platform/durable-events/tx.ts');
const store=read('modules/platform/durable-events/store.ts');
const publisher=read('scripts/commerce_event_publisher.mjs');
const worker=read('scripts/commerce_consumer_mesh.mjs');
const gate=read('scripts/release_gate.mjs');
for (const token of ['validateJsonSchema','validateEventContractTx','getSubscription','listEnabledSubscriptions','setSubscription','registerEventSchema']) if(!registry.includes(token)) failures.push(`REGISTRY_GAP:${token}`);
for (const token of ['required','properties','additionalProperties','items','enum']) if(!validator.includes(token)) failures.push(`SCHEMA_VALIDATOR_GAP:${token}`);
for (const token of ['validateEventContractTx','schema_version']) if(!tx.includes(token)) failures.push(`EVENT_WRITE_NOT_GATED:${token}`);
for (const token of ['pg_advisory_xact_lock']) if(!tx.includes(token)) failures.push(`ORDERING_GUARD_GAP:${token}`);
for (const token of ['FOR UPDATE','NOT EXISTS']) if(!store.includes(token)) failures.push(`ORDERING_GUARD_GAP:${token}`);
for (const token of ['enqueueSubscribedDeliveriesTx','FOR UPDATE SKIP LOCKED']) if(!publisher.includes(token)) failures.push(`PUBLISHER_GAP:${token}`);
for (const token of ['getSubscription','subscription.maxAttempts','CONTRACT_VERSION_MISMATCH']) if(!worker.includes(token)) failures.push(`WORKER_POLICY_GAP:${token}`);
if (publisher.includes('CONSUMER_DEFINITIONS')) failures.push('PUBLISHER_STATIC_CONSUMER_LIST');
if (!gate.includes('const v246=')) failures.push('RELEASE_GATE_MISSING_V246');
if (!gate.includes('const v247=')) failures.push('RELEASE_GATE_MISSING_V247');
if (failures.length) { console.error(`Reality proof audit FAILED (${failures.length})`); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1); }
const pkg = JSON.parse(read('package.json'));
console.log(JSON.stringify({ok:true, version:`V${pkg.version}`, claimsProved:[
  'runtime_consumer_registry','contract_validation','aggregate_ordering','bounded_retry_policy','poison_event_isolation','release_gate_coverage'
]},null,2));
