import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f));
const pkg=JSON.parse(read('package.json')); const report=JSON.parse(read('artifacts/reality/full-system-reality-report.json'));
const evidenceTerms=['runtime','durable','postgres','transaction','worker','consumer','provider','idempot','ordering','retry','schema','migration','api','audit','test','production'];
const files=[];
function walk(dir){for(const n of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){if(['node_modules','.git'].includes(n.name))continue; const rel=path.join(dir,n.name); if(n.isDirectory())walk(rel); else if(/\.(mjs|ts|tsx|md|json|sql)$/.test(n.name))files.push(rel)}}
walk('.');
const graph=[];
for(const r of report.results){ if(r.status!=='DOCUMENTED_ONLY') continue; const text=(r.text||'').toLowerCase(); const candidates=files.map(f=>{const t=read(f).toLowerCase(); let score=0; for(const term of evidenceTerms) if(text.includes(term)&&t.includes(term))score++; const tokens=text.split(/[^a-z0-9]+/).filter(x=>x.length>=6); for(const tok of tokens.slice(0,12)) if(t.includes(tok))score+=2; return {f,score}}).filter(x=>x.score>=3).sort((a,b)=>b.score-a.score).slice(0,8);
 graph.push({id:r.id,source:r.referencedDocs?.[0],line:r.line||null,text:r.text||'',candidateArtifacts:candidates.map(x=>x.f),evidenceStatus:candidates.length?'CANDIDATE':'NO_CANDIDATE'}); }
const out={version:`V${pkg.version}`,generatedAt:new Date().toISOString(),method:'Conservative lexical candidate mapping; candidates are NOT proof until tests/runtime markers are explicitly attached.',source:'artifacts/reality/full-system-reality-report.json',counts:{documentedOnly:graph.length,candidateMapped:graph.filter(x=>x.evidenceStatus==='CANDIDATE').length,noCandidate:graph.filter(x=>x.evidenceStatus==='NO_CANDIDATE').length},nodes:graph};
fs.mkdirSync(path.join(root,'artifacts/reality'),{recursive:true}); fs.writeFileSync(path.join(root,'artifacts/reality/reality-evidence-graph.json'),JSON.stringify(out,null,2)+'\n');
fs.writeFileSync(path.join(root,'artifacts/reality/reality-evidence-graph.md'),`# TRUST ${out.version} — Reality Evidence Graph\n\nGenerated: ${out.generatedAt}\n\nThis graph turns DOCUMENTED_ONLY records into remediation candidates. A candidate mapping is **not proof**; proof still requires an executable artifact, runtime marker, and regression test.\n\n- Documented-only records: ${out.counts.documentedOnly}\n- Candidate-mapped: ${out.counts.candidateMapped}\n- No candidate: ${out.counts.noCandidate}\n\n## Candidate queue\n\n${graph.map(x=>`- **${x.evidenceStatus}** ${x.id}${x.line?` (line ${x.line})`:''} → ${x.candidateArtifacts.join(', ')||'none'}`).join('\n')}\n`);
console.log(`Reality Evidence Graph PASS — ${graph.length} documented-only records; ${out.counts.candidateMapped} candidate-mapped, ${out.counts.noCandidate} with no candidate.`);
