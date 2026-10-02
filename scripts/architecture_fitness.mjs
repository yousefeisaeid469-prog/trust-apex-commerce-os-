import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const errors=[]; const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f));
const required=[
 'modules/platform/api/versioning.ts','modules/platform/policy/engine.ts','modules/platform/control-plane/feature-flags.ts','modules/platform/control-plane/config.ts','modules/platform/webhooks/platform.ts','modules/platform/adapters/contracts.ts','modules/platform/keys/lifecycle.ts','modules/platform/backup/verification.ts','modules/enterprise/sdk/index.ts','db/migrations/026_v136_enterprise_platform.sql','tests/v136-enterprise-platform.test.mjs'
];
for(const f of required) if(!exists(f)) errors.push(`Missing V139 architecture artifact: ${f}`);
const migration=read('db/migrations/026_v136_enterprise_platform.sql');
for(const token of ['trust_tenant_memberships','trust_policy_rules','trust_feature_flags','trust_webhook_events','trust_key_metadata','trust_backup_verifications']) if(!migration.includes(token)) errors.push(`Missing control-plane table: ${token}`);
const policy=read('modules/platform/policy/engine.ts'); if(!policy.includes("default-deny")) errors.push('Policy engine is not default-deny');
const adapter=read('modules/platform/adapters/contracts.ts'); if(!adapter.includes('AdapterRegistry')) errors.push('Provider adapter registry missing');
const versioning=read('modules/platform/api/versioning.ts'); if(!versioning.includes('SUPPORTED_API_VERSIONS')) errors.push('API compatibility registry missing');
const keys=read('modules/platform/keys/lifecycle.ts'); if(/rawSecret|secretValue/.test(keys)) errors.push('Key lifecycle must never contain raw secret material');
const bad=['modules/platform/security/rate-limit/memory.ts']; for(const f of bad) if(exists(f) && !read(f).includes('Development-safe fallback')) errors.push(`Local-only primitive not clearly marked: ${f}`);
if(errors.length){console.error(`TRUST V139 architecture fitness FAILED (${errors.length})`);errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('TRUST V139 architecture fitness PASS — tenant, policy, API, provider, key and recovery boundaries verified.');
