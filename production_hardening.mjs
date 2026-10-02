import fs from 'node:fs';
import { runLocalHardeningChecks } from '../modules/platform/production-hardening/core.ts';
const started=Date.now();
const result=await runLocalHardeningChecks();
const report={version:'V295.0.0',status:result.failed===0?'HARDENING_LOCAL_CHECKS_PASS':'HARDENING_LOCAL_CHECKS_FAIL',generatedAt:new Date().toISOString(),durationMs:Date.now()-started,checks:result.checks,scope:{mode:'DETERMINISTIC_LOCAL',liveDatabase:false,liveProvider:false,liveLoadGenerator:false}};
fs.mkdirSync('artifacts/hardening',{recursive:true});
fs.writeFileSync('artifacts/hardening/production-hardening-v295.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(result.failed) process.exit(1);
