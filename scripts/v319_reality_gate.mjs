import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(); const errors=[]; const warnings=[];
const apiRoot=path.join(root,'app','api'); const routes=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name==='route.ts')routes.push(p)}} walk(apiRoot);
const bad=/Contract exists; production capability is not implemented|production capability is not implemented|This capability has a contract but no production implementation|surfaceStatus:\s*['"]FOUNDATION['"]/i;
for(const p of routes){const s=fs.readFileSync(p,'utf8');if(bad.test(s))errors.push(`Placeholder/foundation API: ${path.relative(root,p)}`)}
function inspectEvidence(p){if(!fs.existsSync(p))return;let a;try{a=JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){errors.push(`Invalid evidence JSON: ${p}: ${e.message}`);return}for(const c of a.cases??a.checks??[]){if(c.status==='PASS'&&Number(c.durationMs)<=0)errors.push(`Non-executed PASS evidence: ${p}:${c.caseId??c.name}`);if(c.status==='PASS'&&c.environment==='sandbox'&&a.productionVerified===true)errors.push(`Sandbox evidence promoted to production: ${p}`)}if(a.status==='PASS'&&a.liveDatabase===false&&a.externalProvidersLive===false)warnings.push(`Report is sandbox/partial, not production proof: ${p}`)}
inspectEvidence('artifacts/v315/verification-summary.json'); inspectEvidence('artifacts/v318/integration-lab-report.json');
const result={version:'V319.0.0',status:errors.length?'FAIL':'PASS',routeCount:routes.length,errors,warnings,generatedAt:new Date().toISOString()};result.evidenceHash=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');fs.mkdirSync('artifacts/v319',{recursive:true});fs.writeFileSync('artifacts/v319/reality-gate.json',JSON.stringify(result,null,2)+'\n');console.log(`V319 reality gate ${result.status} — ${routes.length} API routes scanned, ${errors.length} errors, ${warnings.length} warnings`);if(errors.length)process.exit(1);
