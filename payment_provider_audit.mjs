import fs from 'node:fs';
import path from 'node:path';
const required = [
  'modules/platform/payment-providers/contracts.ts',
  'modules/platform/payment-providers/http-adapter.ts',
  'modules/platform/payment-providers/registry.ts',
  'scripts/payment_provider_worker.mjs',
  'db/migrations/093_v239_real_provider_execution.sql',
  'db/migrations/094_v240_provider_reliability.sql'
];
const missing = required.filter(p => !fs.existsSync(path.resolve(p)));
if (missing.length) throw new Error(`PAYMENT_PROVIDER_FILES_MISSING:${missing.join(',')}`);
const env = fs.readFileSync('.env.example','utf8');
for (const key of ['PAYMENTS_PROVIDER_BASE_URL','PAYMENTS_PROVIDER_SECRET','PAYMENT_PROVIDER_TIMEOUT_MS']) if (!env.includes(key)) throw new Error(`ENV_MISSING:${key}`);
const migration = fs.readFileSync('db/migrations/093_v239_real_provider_execution.sql','utf8');
const reliability = fs.readFileSync('db/migrations/094_v240_provider_reliability.sql','utf8');
for (const token of ['trust_payment_provider_jobs','CREATE_PAYMENT','REFUND','PAYOUT','lease_until']) if (!migration.includes(token)) throw new Error(`MIGRATION_INCOMPLETE:${token}`);
for (const token of ['uq_payment_provider_create_job_payment','uq_payment_provider_refund_job_refund']) if (!reliability.includes(token)) throw new Error(`RELIABILITY_MIGRATION_INCOMPLETE:${token}`);
console.log(JSON.stringify({ok:true,audit:'PAYMENT_PROVIDER_EXECUTION',checks:required.length+6},null,2));
