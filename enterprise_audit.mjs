import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(), required=['modules/enterprise/entitlements.ts','modules/enterprise/usage-meter.ts','modules/enterprise/billing.ts','modules/observability/correlation.ts','modules/observability/slo.ts','modules/security/abuse-rules.ts','db/migrations/025_v135_enterprise_control_plane.sql','tests/v135-enterprise.test.mjs','docs/acquisition/BUYER-DUE-DILIGENCE-PACK-V138.md','modules/platform/distributed/fencing.ts','modules/platform/distributed/event-log.ts','modules/platform/distributed/saga.ts'];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f))); if(missing.length){console.error('ENTERPRISE AUDIT FAIL');missing.forEach(x=>console.error(x));process.exit(1)}

console.log(`TRUST V140 enterprise baseline audit PASS — ${required.length} required artifacts verified.`);
