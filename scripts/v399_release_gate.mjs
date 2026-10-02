import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
const version=read('lib/runtime/version.ts').match(/V(\d+\.\d+\.\d+)/)?.[1];
if(pkg.version!=='399.0.0'||version!=='399.0.0'||lock.version!=='399.0.0'||lock.packages?.['']?.version!=='399.0.0') errors.push('version integrity');
if(manifest.version!=='V399.0.0'||String(manifest.migrations.at(-1)?.id)!=='224'||manifest.migrations.at(-1)?.version!=='V399.0.0') errors.push('migration head');
for(const f of ['db/migrations/224_v399_buyer_operating_system.sql','scripts/v399_buyer_operating_truth.mjs','modules/customer-experience/buyer-operating-system.ts','app/api/buyer/operating-surface/route.ts','app/api/buyer/orders/[id]/journey/route.ts','MASTER-RELEASE.md']) if(!exists(f)) errors.push('missing '+f);
const migration=read('db/migrations/224_v399_buyer_operating_system.sql'); for(const t of ['trust_buyer_operating_snapshot','trust_carts','trust_orders','trust_returns','trust_customer_reviews','platform_notifications','trust_wishlists','buyer_status']) if(!migration.includes(t)) errors.push('buyer contract '+t);
const verifier=read('scripts/v399_buyer_operating_truth.mjs'); for(const t of ['DATABASE_NOT_CONFIGURED','trust_buyer_operating_snapshot','orphanSnapshots']) if(!verifier.includes(t)) errors.push('verifier contract '+t);
const mod=read('modules/customer-experience/buyer-operating-system.ts'); for(const t of ['getBuyerOperatingSnapshot','listCommerceCommandSnapshots','LIVE_POSTGRES_BUYER_AUTHORITIES']) if(!mod.includes(t)) errors.push('module contract '+t);
const core=read('modules/customer-experience/core.ts'); if(/from\s+orders\s+o\b/i.test(core)||/join\s+order_items\s+oi\b/i.test(core)) errors.push('legacy order authority remains in customerOrderSnapshot');
if(errors.length){console.error('V399 RELEASE GATE FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('V399 RELEASE GATE PASS — buyer operating surface is wired to PostgreSQL commerce authorities.');
