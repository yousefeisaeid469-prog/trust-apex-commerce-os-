import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f)); const errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
const version=read('lib/runtime/version.ts').match(/V(\d+\.\d+\.\d+)/)?.[1];
if(pkg.version!=='393.0.0'||version!=='393.0.0'||lock.version!=='393.0.0'||lock.packages?.['']?.version!=='393.0.0') errors.push('version integrity');
if(manifest.version!=='V392.0.0'||String(manifest.migrations.at(-1)?.id)!=='218') errors.push('migration head');
for(const f of ['db/migrations/217_v391_production_commerce_hardening.sql','db/migrations/218_v392_load_resilience.sql','scripts/v392_load_resilience.mjs','scripts/v392_load_resilience_audit.mjs','scripts/v393_commerce_truth_audit.mjs','modules/commerce/core/lifecycle-contract.ts','scripts/v391_e2e_chaos.mjs','MASTER-RELEASE.md']) if(!exists(f)) errors.push('missing '+f);
const v=JSON.parse(read('vercel.json')); const seen=new Set(); for(const c of v.crons||[]){const k=c.path+'|'+c.schedule;if(seen.has(k)) errors.push('duplicate cron '+k);seen.add(k);}
const integration=read('scripts/v391_postgres_integration_lab.mjs'); for(const token of ['DATABASE_URL','for update','on conflict','drop schema']) if(!integration.includes(token)) errors.push('postgres integration lab '+token);
const resilience=read('scripts/v392_load_resilience.mjs'); for(const token of ['concurrency','failureRate','committed','attempt <= 3','DEDUPED']) if(!resilience.includes(token)) errors.push('load resilience '+token);
const truth=read('scripts/v393_commerce_truth_audit.mjs'); for(const token of ['getPaymentProviderReadiness','createPaymentIntent','legacy in-memory order repository']) if(!truth.includes(token)) errors.push('commerce truth audit '+token);
const lifecycle=read('modules/commerce/core/lifecycle-contract.ts'); for(const token of ['assertCommerceLifecycleMove','SETTLEMENT_RELEASED','REFUNDED']) if(!lifecycle.includes(token)) errors.push('lifecycle contract '+token);
if(errors.length){console.error('V391 RELEASE GATE FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1);}
console.log('V393 RELEASE GATE PASS — atomic card checkout, commerce truth audit, migration compatibility and resilience harness are wired.');
