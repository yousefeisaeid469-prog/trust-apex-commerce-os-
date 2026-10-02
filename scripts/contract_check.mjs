import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd();
const required=[
'package.json','package-lock.json','MASTER-RELEASE.md','next.config.mjs','tsconfig.json','.env.example','vercel.json',
'modules/platform/persistence/contracts.ts','modules/platform/security/circuit-breaker.ts','modules/platform/observability/logger.ts','modules/platform/persistence/migrations/002_v88_operational.sql',
'modules/experience/prevention/engine.ts','app/api/prevention/route.ts','app/prevention/page.tsx','app/prevention-admin/page.tsx',
'db/migrations/015_v126_protection_os.sql','modules/experience/protection/engine.ts','app/api/protection/route.ts','app/protection/page.tsx','app/protection-admin/page.tsx',
'modules/platform/decision-fabric/index.ts','modules/platform/decision-fabric/persistence.ts','modules/platform/decision-fabric/service.ts','modules/platform/audit/ledger.ts',
'app/api/decision-fabric/route.ts','app/decision-fabric/page.tsx','app/decision-fabric-admin/page.tsx','db/migrations/018_v128_decision_fabric.sql','db/migrations/019_v129_production_integrity.sql','db/migrations/021_v131_operational_excellence.sql',
'tests/decision-fabric.test.ts','modules/platform/integrity/overview.ts','app/api/production-integrity/route.ts','app/production-integrity-admin/page.tsx','scripts/migrate.mjs','scripts/migration_check.mjs','db/migrations/MANIFEST.json'
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));if(missing.length){console.error('Missing required files:',missing);process.exit(1)}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));const major=Number(String(pkg.version).split('.')[0]);if(!Number.isInteger(major)||major<134)process.exit(2);
console.log(`Contract check PASS — current ${pkg.version} — ${required.length} required artifacts`);

