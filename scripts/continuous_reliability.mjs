import {mkdir,writeFile} from 'node:fs/promises';
import {runContinuousReliability} from '../modules/platform/reliability-control-plane/continuous.ts';
const seeds=[143143,143144,143145,143146,143147]; const known=new Set(); const results=seeds.map((seed,i)=>runContinuousReliability(`v143-${i+1}`,seed,known)); for(const r of results)if(r.failureHash)known.add(r.failureHash);
await mkdir('artifacts/reliability-control-plane',{recursive:true}); await writeFile('artifacts/reliability-control-plane/release-verdicts.json',JSON.stringify({version:'V143.0.0',campaigns:results,knownFailureHashes:[...known]},null,2));
const blocked=results.filter(x=>x.verdict.status==='BLOCK').length; console.log(JSON.stringify({version:'V143.0.0',campaigns:results.length,blocked,reproducible:results.every(x=>x.replayMatches)},null,2)); if(!results.every(x=>x.replayMatches))process.exit(1);
