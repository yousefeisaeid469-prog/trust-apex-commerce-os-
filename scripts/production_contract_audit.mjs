import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const api=path.join(root,'app','api');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.name==='route.ts'||e.name==='route.tsx')files.push(f);}}
walk(api);
const violations=[];
for(const file of files){
  const s=fs.readFileSync(file,'utf8');
  if(/surfaceStatus\s*:\s*['"]SIMULATION['"]/.test(s) && /accepted\s*:\s*true/.test(s)) violations.push(path.relative(root,file)+': simulation endpoint claims accepted=true');
  if(/surfaceStatus\s*:\s*['"]SIMULATION['"]/.test(s) && !/status\s*:\s*501/.test(s) && !/NextResponse\.json\([^\n]*\{\s*status\s*:\s*501/.test(s)) violations.push(path.relative(root,file)+': simulation endpoint must be explicit non-production');
}
if(violations.length){console.error('PRODUCTION CONTRACT AUDIT FAILED');violations.forEach(v=>console.error('- '+v));process.exit(1)}
console.log(`PRODUCTION CONTRACT AUDIT PASS — ${files.length} API route files scanned; no simulation surface is presented as accepted production behavior.`);
