import fs from 'node:fs'; import path from 'node:path';
const required=['modules/platform/runtime/request-context.ts','modules/platform/http/response.ts','modules/platform/audit/service.ts','modules/platform/idempotency/service.ts','modules/platform/webhooks/inbox.ts','modules/platform/capabilities/registry.ts','app/api/platform/health/route.ts','app/api/platform/capabilities/route.ts','db/migrations/079_v230_production_kernel.sql'];
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('Production kernel audit FAIL',missing);process.exit(1)}
const sql=fs.readFileSync('db/migrations/079_v230_production_kernel.sql','utf8'); for(const t of ['trust_audit_events','trust_idempotency_keys','trust_webhook_inbox']) if(!sql.includes(`create table if not exists ${t}`)) throw new Error(`MISSING_TABLE:${t}`);
console.log(`Production kernel audit PASS — ${required.length} artifacts verified.`);
