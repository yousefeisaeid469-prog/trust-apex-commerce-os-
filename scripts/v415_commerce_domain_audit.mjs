import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const failures=[];
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='415.0.0') failures.push('package.version');
if(!read('lib/runtime/version.ts').includes("RUNTIME_VERSION='415.0.0'")) failures.push('runtime.version');
if(!read('db/migrations/MANIFEST.json').includes('240_v415_global_commerce_domain_kernel.sql')) failures.push('migration.manifest');
for(const f of ['app/api/commerce/domain/route.ts','modules/commerce/core/commerce-domain-kernel.ts']) if(!fs.existsSync(path.join(root,f))) failures.push(f);
if(failures.length){console.error('V415 COMMERCE DOMAIN AUDIT FAIL',failures);process.exit(1)}
console.log('V415 COMMERCE DOMAIN AUDIT PASS');
