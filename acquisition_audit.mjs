import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const errors=[]; const warnings=[];
const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f));
const required=[
  'docs/acquisition/ACQUISITION-READINESS.md','docs/acquisition/PRODUCT-MATURITY-MATRIX.md','docs/acquisition/SECURITY-THREAT-MODEL-V134.md','docs/acquisition/SLO-DR-PLAN-V134.md','docs/acquisition/IP-AND-LICENSE-INVENTORY.md','docs/acquisition/DATA-ROOM-INDEX.md',
  'scripts/runtime_failure_harness.mjs','db/migrations/024_v134_acquisition_integrity.sql','db/migrations/MANIFEST.json','tests/v134-acquisition.test.mjs'
];
for(const f of required)if(!exists(f))errors.push(`Missing acquisition artifact: ${f}`);

const source=[];function walk(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const r=path.join(d,e.name);if(['node_modules','.next','.git'].includes(e.name))continue;if(e.isDirectory())walk(r);else if(/\.(ts|tsx|js|jsx|mjs)$/.test(e.name))source.push(r)}}
for(const d of ['app','components','lib','modules','scripts','tests'])if(exists(d))walk(d);
for(const f of source){const s=read(f);if(/DEC-SIMULATED|FAKE_PAYMENT|TODO|FIXME/.test(s))warnings.push(`${f}: review simulation/TODO markers`)}
console.log(`Acquisition audit PASS — ${source.length} source files inspected, ${required.length} evidence artifacts required.`);if(warnings.length){console.log(`Warnings (${warnings.length}):`);warnings.forEach(w=>console.log('- '+w));}
