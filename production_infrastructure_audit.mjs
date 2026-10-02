import fs from 'node:fs';
const files=['modules/platform/production-infrastructure/contracts.ts','modules/platform/production-infrastructure/http.ts','modules/platform/production-infrastructure/kubernetes.ts','modules/platform/production-infrastructure/traffic.ts','modules/platform/production-infrastructure/idempotency.ts','modules/platform/production-infrastructure/orchestrator.ts','db/migrations/039_v149_production_infrastructure.sql','tests/v149-production-infrastructure.test.mjs'];
const missing=files.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('FAIL',missing);process.exit(1)}
for(const f of files){const s=fs.readFileSync(f,'utf8');if(!s.trim())throw new Error(`EMPTY:${f}`)}
console.log('V149 production infrastructure audit: PASS');
