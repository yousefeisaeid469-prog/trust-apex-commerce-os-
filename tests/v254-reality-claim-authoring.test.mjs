import fs from 'node:fs';
const a=JSON.parse(fs.readFileSync('artifacts/reality/reality-claim-authoring.json','utf8'));
if(!/^V\d+\.0\.0$/.test(a.version)) throw new Error(`invalid version=${a.version}`);
if(a.counts.drafts!==96) throw new Error(`drafts=${a.counts.drafts}`);
if(a.drafts.some(d=>d.status!=='DRAFT_NEEDS_AUTHORING')) throw new Error('draft status drift');
if(a.drafts.some(d=>d.contract.runtimeMarkers.length!==0 || d.contract.tests.length!==0)) throw new Error('unsafe auto-evidence');
console.log(`V254 reality claim authoring PASS — ${a.counts.drafts} drafts, zero auto-promoted evidence.`);
