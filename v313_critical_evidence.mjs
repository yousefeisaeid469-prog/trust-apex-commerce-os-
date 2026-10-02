import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=process.cwd();
const commands=[['v313-platform-foundation.test.mjs','tests/v313-platform-foundation.test.mjs'],['v313-evidence-suite.mjs','scripts/v313_evidence_suite.mjs']];
const results=[];
for(const [name,file] of commands){try{const out=execFileSync(process.execPath,['--experimental-strip-types',file],{cwd:root,encoding:'utf8'});results.push({name,status:'PASS',output:out.trim()});}catch(e){results.push({name,status:'FAIL',output:String(e.stdout??e.message)});}}
const status=results.every(x=>x.status==='PASS')?'PASS':'FAIL';
const report={version:'V313.0.0',status,criticalWorkflows:results,liveProviders:false,liveDatabase:false,generatedAt:new Date().toISOString()};
report.evidenceHash=crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
fs.writeFileSync('artifacts/v313/critical-evidence.json',JSON.stringify(report,null,2)+'\n');
console.log(`V313 critical evidence ${status}`);if(status!=='PASS')process.exit(1);
