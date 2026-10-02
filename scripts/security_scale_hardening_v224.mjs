import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(), ignored=new Set(['node_modules','.next','.git']); const files=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignored.has(e.name))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p):files.push(p)}} walk(root);
const src=files.filter(f=>/\.(ts|tsx|mjs|js)$/.test(f));
const routeFiles=src.filter(f=>f.includes(`${path.sep}app${path.sep}api${path.sep}`)&&f.endsWith('route.ts'));
const sensitive=/\/api\/(admin|agent|autopilot|revenue|financial|payment|refund|merchant|seller|campaign|sourcing|negotiation|control|internal)/i;
const guard=/requireAdminSession|requireAdmin\(|requirePermission|requireUser|getCurrentUser|verifyAdminSession|trust_session|verifyWebhook|webhookSignature/; const publicExceptions=new Set(['app/api/merchant-supergraph/route.ts','app/api/merchants/route.ts']);
const missing=routeFiles.filter(f=>sensitive.test('/'+path.relative(root,f).replaceAll(path.sep,'/'))&&!publicExceptions.has(path.relative(root,f).replaceAll(path.sep,'/'))&&!guard.test(fs.readFileSync(f,'utf8')));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const issues=[];
if(missing.length) issues.push(...missing.map(f=>`sensitive route missing detected guard: ${path.relative(root,f)}`));
if(!fs.existsSync(path.join(root,'db/migrations/075_v224_security_scale_hardening.sql')))issues.push('missing V224 database hardening migration');
if(!fs.existsSync(path.join(root,'package-lock.json')))issues.push('package-lock missing');
if(!pkg.scripts?.['security-scale-hardening-v224'])issues.push('security-scale-hardening-v224 script missing');
if(issues.length){console.error('TRUST V224 security/scale hardening FAILED');issues.forEach(x=>console.error('- '+x));process.exit(1)}
console.log(`TRUST V224 security/scale hardening PASS — ${routeFiles.length} API routes scanned, ${src.length} source files scanned.`);
