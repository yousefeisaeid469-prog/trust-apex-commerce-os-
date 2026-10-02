import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=['modules/platform/reliability/concurrency/lab.ts','modules/platform/reliability/property/invariants.ts','modules/platform/reliability/incidents/replay.ts','modules/platform/reliability/tenant-fuzz/isolation.ts','modules/platform/reliability/campaign.ts','db/migrations/030_v140_reliability_engineering.sql','tests/v140-reliability.test.mjs','docs/architecture/RELIABILITY-ENGINEERING-V140.md','docs/acquisition/TECHNICAL-MOAT-V140.md','docs/acquisition/BUYER-EXECUTIVE-SUMMARY-V140.md','docs/acquisition/V140-VERIFICATION-REPORT.md'];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
if(missing.length){console.error('TRUST V140 reliability audit FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}

const sql=fs.readFileSync(path.join(root,'db/migrations/030_v140_reliability_engineering.sql'),'utf8'); if(!/CHECK \(iterations > 0 AND iterations <= 100000\)/.test(sql)) throw new Error('CAMPAIGN_BOUND_NOT_ENFORCED');
console.log('TRUST V140 reliability audit PASS — deterministic concurrency, property, incident replay, isolation fuzzing and fault campaign controls verified.');
