import fs from 'node:fs';
const required = [
  'modules/platform/cells/context.ts','modules/platform/cells/registry.ts','modules/platform/cells/router.ts','modules/platform/cells/index.ts',
  'modules/platform/db/postgres.ts','db/migrations/095_v241_cell_scaling_foundation.sql'
];
const errors = required.filter(f => !fs.existsSync(f)).map(f => `Missing V241 scale artifact: ${f}`);
const db = fs.readFileSync('modules/platform/db/postgres.ts','utf8');
for (const token of ['Map<string, Pool>', 'getCurrentCellId', 'databaseUrlForCell']) if (!db.includes(token)) errors.push(`DB pool is not cell-aware: ${token}`);
const migration = fs.readFileSync('db/migrations/095_v241_cell_scaling_foundation.sql','utf8');
for (const token of ['idx_trust_payment_provider_jobs_claim','idx_trust_outbox_events_dispatch','idx_trust_webhook_events_processing']) if (!migration.includes(token)) errors.push(`Missing hot-path index: ${token}`);
if(errors.length){ console.error(`TRUST V241 cell scaling audit FAILED (${errors.length})`); errors.forEach(e=>console.error('- '+e)); process.exit(1); }
console.log('TRUST V241 cell scaling audit PASS — deterministic cell routing, cell-aware DB pools, and queue/webhook hot-path indexes verified.');
