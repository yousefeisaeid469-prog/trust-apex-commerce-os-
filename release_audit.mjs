import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), ignored=new Set(['node_modules','.next','.git']), files=[];
function walk(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(/\.(ts|tsx|js|jsx|mjs|json|md|yml|yaml)$/.test(e.name))files.push(f);}}
walk(root); const issues=[];
for(const f of files){const s=fs.readFileSync(f,'utf8'), rel=path.relative(root,f);
 if(/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9_-]{12,}\b/.test(s))issues.push(`${rel}: possible Stripe key`);
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(s))issues.push(`${rel}: private key material`);
 if(!rel.endsWith('release_audit.mjs') && !rel.endsWith('security_audit_v221.mjs') && /\beval\s*\(/.test(s))issues.push(`${rel}: eval() usage`);
}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const runtime=fs.readFileSync(path.join(root,'lib/runtime/version.ts'),'utf8').match(/TRUST_RUNTIME_VERSION\s*=\s*['"]V([^'"]+)['"]/)?.[1];
if(!runtime)issues.push('lib/runtime/version.ts: canonical runtime version missing');
if(pkg.version!==runtime)issues.push(`package.json: version ${pkg.version} does not match runtime ${runtime}`);
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
if(lock.version!==pkg.version || lock.packages?.['']?.version!==pkg.version)issues.push('package-lock.json: version mismatch');
if(pkg.scripts?.build!=='next build')issues.push('package.json: build script mismatch');
if(!fs.existsSync(path.join(root,'package-lock.json')))issues.push('package-lock.json missing');
if(!fs.existsSync(path.join(root,'MASTER-RELEASE.md')))issues.push('MASTER-RELEASE.md missing');
if(issues.length){console.error(`Release audit FAILED (${issues.length})`);issues.forEach(x=>console.error('- '+x));process.exit(1);}
console.log(`Release audit OK — ${files.length} files scanned.`);
