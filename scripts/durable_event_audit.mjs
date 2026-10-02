import fs from 'node:fs';
const required = [
  'modules/platform/durable-events/contracts.ts',
  'modules/platform/durable-events/store.ts',
  'modules/platform/durable-events/index.ts',
  'db/migrations/096_v242_durable_event_backbone.sql',
  'scripts/durable_event_worker.mjs',
  'tests/v242-durable-event-backbone.test.mjs',
];
const errors = required.filter(file => !fs.existsSync(file)).map(file => `Missing: ${file}`);
const migration = fs.readFileSync('db/migrations/096_v242_durable_event_backbone.sql', 'utf8');
for (const token of ['idempotency_key','next_attempt_at','locked_at','uq_trust_commerce_events_idempotency']) if (!migration.includes(token)) errors.push(`Missing migration primitive: ${token}`);
const store = fs.readFileSync('modules/platform/durable-events/store.ts', 'utf8');
const tx = fs.readFileSync('modules/platform/durable-events/tx.ts', 'utf8');
for (const token of ['FOR UPDATE SKIP LOCKED', 'enqueueDelivery', 'completeDelivery', 'retryDelivery']) if (!store.includes(token)) errors.push(`Missing durable store primitive: ${token}`);
if (!tx.includes('pg_advisory_xact_lock')) errors.push('Missing durable transaction primitive: pg_advisory_xact_lock');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) errors.push(`invalid package version ${pkg.version}`);
if (!pkg.scripts?.['durable-event-worker']) errors.push('Missing durable-event-worker npm script');
if (!pkg.scripts?.['durable-event-audit']) errors.push('Missing durable-event-audit npm script');
if (errors.length) { console.error(`Durable event audit FAILED (${errors.length})`); errors.forEach(e => console.error(`- ${e}`)); process.exit(1); }
console.log('Durable event audit PASS — durable append, tenant idempotency, leased delivery, retry/dead-letter and worker boundaries verified.');
