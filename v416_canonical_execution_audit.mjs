import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const failures=[];
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='416.0.0') failures.push('package.version');
if(!read('lib/runtime/version.ts').includes("RUNTIME_VERSION='416.0.0'")) failures.push('runtime.version');
for(const f of ['modules/commerce/core/canonical-commerce-kernel.ts','db/migrations/241_v416_canonical_commerce_execution_path.sql','scripts/v416_canonical_execution_test.mjs']) if(!fs.existsSync(path.join(root,f))) failures.push(`missing:${f}`);
// Production entrypoints must cross the canonical write boundary.
for(const f of ['modules/commerce/core/engine.ts','app/api/checkout/global/commit/route.ts']) {
  const s=read(f);
  if(!s.includes('canonical-commerce-kernel')) failures.push(`missing canonical import:${f}`);
}
// No API route may directly import the implementation surfaces.
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.ts')||e.name.endsWith('.tsx')){const s=fs.readFileSync(p,'utf8');if(s.includes('/modules/commerce/transactions/checkout')||s.includes('/modules/commerce/transactions/global-checkout')) failures.push(`direct transaction import:${path.relative(root,p)}`);}}}
walk(path.join(root,'app/api'));
if(failures.length){console.error('V416 CANONICAL EXECUTION AUDIT FAIL', failures);process.exit(1)}
console.log('V416 CANONICAL EXECUTION AUDIT PASS');
