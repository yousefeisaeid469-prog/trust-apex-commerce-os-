import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(read('package.json'));
const graph=JSON.parse(read('artifacts/reality/reality-evidence-graph.json'));
const ledger=JSON.parse(read('config/reality/release-claims-v248.json'));
const structuredIds=new Set((ledger.claims??[]).map(c=>c.id));
const drafts=(graph.nodes??[]).filter(n=>!structuredIds.has(n.id)).map(n=>({
  id:`draft-${n.id}`,
  sourceId:n.id,
  claim:n.text,
  status:'DRAFT_NEEDS_AUTHORING',
  contract:{artifacts:n.candidateArtifacts??[],runtimeMarkers:[],tests:[]},
  policy:'Candidate artifacts are hints only. An author must explicitly attach runtime markers and regression tests before promotion.',
  evidence:{implementation:'UNVERIFIED',runtimeMarkers:'UNVERIFIED',regressionTests:'UNVERIFIED'}
}));
const out={version:`V${pkg.version}`,generatedAt:new Date().toISOString(),policy:'Authoring separates lexical discovery from proof. No draft can become PROVEN without explicit artifact, runtime-marker, and regression-test references.',counts:{drafts: drafts.length,withCandidates:drafts.filter(d=>d.contract.artifacts.length>0).length,withoutCandidates:drafts.filter(d=>d.contract.artifacts.length===0).length},drafts};
fs.mkdirSync(path.join(root,'artifacts/reality'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/reality/reality-claim-authoring.json'),JSON.stringify(out,null,2)+'\n');
fs.writeFileSync(path.join(root,'artifacts/reality/reality-claim-authoring.md'),`# TRUST ${out.version} — Reality Claim Authoring\n\nGenerated: ${out.generatedAt}\n\nThis queue converts documentation-only records into explicit authoring contracts. It does **not** promote them.\n\n- Drafts: ${out.counts.drafts}\n- With candidate artifacts: ${out.counts.withCandidates}\n- Without candidates: ${out.counts.withoutCandidates}\n\n## Promotion contract\n\nEvery draft must be authored with:\n1. explicit implementation artifacts;\n2. explicit runtime markers that are executable/observable in source;\n3. explicit regression tests.\n\nOnly then may the V253 promotion engine evaluate it.\n`);
console.log(`Reality Claim Authoring PASS — ${out.counts.drafts} drafts; ${out.counts.withCandidates} with candidate artifacts, ${out.counts.withoutCandidates} without candidates.`);
