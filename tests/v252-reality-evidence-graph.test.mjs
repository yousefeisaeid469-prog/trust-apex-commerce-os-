import fs from 'node:fs';
const g=JSON.parse(fs.readFileSync('artifacts/reality/reality-evidence-graph.json','utf8'));
if(!g.version.match(/^V\d+\.0\.0$/)) throw new Error(`invalid graph version: ${g.version}`);
if(g.counts.documentedOnly!==g.nodes.length) throw new Error('graph count mismatch');
if(g.nodes.some(n=>n.evidenceStatus==='CANDIDATE' && n.candidateArtifacts.length===0)) throw new Error('invalid candidate node');
if(!fs.readFileSync('scripts/reality_evidence_graph.mjs','utf8').includes('candidates are NOT proof')) throw new Error('graph must remain conservative');
console.log(`V252 reality evidence graph regression PASS — ${g.nodes.length} records remain conservatively mapped.`);
