import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const pkg = JSON.parse(read('package.json'));
const authoring = JSON.parse(read('artifacts/reality/reality-claim-authoring.json'));

function classify(text) {
  const t = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const limitation = /\b(does not claim|doesn't claim|not claim|not equivalent|does not imply|does not pretend|not considered verified|remain required|still require|required before|requires (?:a|an|real|production)|remain unproven|without corresponding|environment dependent|no direct production|reference implementation|in memory adapter|test adapter|source verification|source level verification|production deployment|live production|external integrations|credentials|provider certification|not .* live production)\b/.test(t);
  const verificationOnly = /\b(test|tests|verification|audit|release gate|validation)\b/.test(t) && /\b(pass|passed|reported|verification|validation)\b/.test(t) && !/\b(adds?|provides?|introduces?|turns?|extends?|exposes?|persists?|supports?|enforces?|routes?|creates?)\b/.test(t);
  const titleOnly = /^trust v\d+(?:\.0\.0)?\s*[—-]/i.test(text.trim()) || /^release:/i.test(text.trim());
  if (limitation) return 'LIMITATION_STATEMENT';
  if (titleOnly) return 'RELEASE_TITLE';
  if (verificationOnly) return 'VERIFICATION_STATEMENT';
  return 'CAPABILITY_CLAIM';
}

function tokenize(text) {
  return [...new Set(text.toLowerCase().split(/[^a-z0-9_]+/).filter(x => x.length >= 7))].slice(0, 18);
}

const allFiles = [];
function walk(rel) {
  const dir = path.join(root, rel);
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next'].includes(ent.name)) continue;
    const child = path.join(rel, ent.name);
    if (ent.isDirectory()) walk(child);
    else if (/\.(mjs|ts|tsx|json|sql)$/.test(ent.name)) allFiles.push(child);
  }
}
walk('.');
const testFiles = allFiles.filter(f => /(^|\/)tests\/.+\.test\.(mjs|ts)$/.test(f));

function inspectCandidates(draft) {
  const tokens = tokenize(draft.claim);
  const artifactCandidates = (draft.contract?.artifacts ?? []).filter(exists).slice(0, 8);
  const markerCandidates = [];
  for (const file of artifactCandidates) {
    const text = read(file);
    for (const token of tokens) {
      if (text.toLowerCase().includes(token) && token.length >= 8) {
        markerCandidates.push({ file, marker: token, kind: 'lexical_candidate' });
      }
    }
  }
  const testCandidates = [];
  for (const file of testFiles) {
    const text = read(file).toLowerCase();
    const hits = tokens.filter(t => text.includes(t));
    if (hits.length >= 2) testCandidates.push({ file, hits: hits.slice(0, 6), kind: 'lexical_candidate' });
  }
  return {
    implementationCandidates: artifactCandidates,
    markerCandidates: markerCandidates.slice(0, 12),
    testCandidates: testCandidates.sort((a,b) => b.hits.length-a.hits.length).slice(0, 8)
  };
}

const records = authoring.drafts.map(draft => {
  const classification = classify(draft.claim);
  const candidates = inspectCandidates(draft);
  let status = 'NEEDS_EXPLICIT_AUTHORING';
  let reason = 'Lexical candidates are discovery hints only; explicit runtime markers and regression tests are required for proof.';
  if (classification === 'LIMITATION_STATEMENT') {
    status = 'NON_CLAIM_LIMITATION';
    reason = 'This record describes a boundary, prerequisite, or non-claim. It must not be promoted as a production capability.';
  } else if (classification === 'RELEASE_TITLE') {
    status = 'NON_CLAIM_TITLE';
    reason = 'Release-title text is metadata, not evidence of a production capability.';
  } else if (classification === 'VERIFICATION_STATEMENT') {
    status = 'VERIFICATION_NARRATIVE';
    reason = 'Verification narrative is not itself a capability contract; concrete implementation/runtime/test evidence is still required.';
  }
  return { id: draft.id, sourceId: draft.sourceId, claim: draft.claim, classification, status, reason, candidates };
});

const counts = Object.fromEntries([...new Set(records.map(r => r.status))].map(s => [s, records.filter(r => r.status === s).length]));
const out = {
  version: `V${pkg.version}`,
  generatedAt: new Date().toISOString(),
  policy: 'The resolver separates capability claims from limitation/title/verification prose and produces discovery candidates without treating lexical matches as proof. Only an explicit structured contract may enter promotion.',
  counts,
  records
};

fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-claim-resolution.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-claim-resolution.md'), [
  `# TRUST ${out.version} — Reality Claim Resolution`, '',
  `Generated: ${out.generatedAt}`, '',
  out.policy, '',
  '## Counts',
  ...Object.entries(counts).map(([k,v]) => `- ${k}: ${v}`), '',
  '## Resolution rules',
  '- Limitation statements are classified as boundaries/non-claims and cannot be promoted.',
  '- Release titles are metadata and cannot be promoted.',
  '- Verification narratives are kept separate from capability contracts.',
  '- Capability claims receive implementation/marker/test discovery candidates only.',
  '- Lexical candidates are never proof.', '',
  '## Records',
  ...records.map(r => `- **${r.status}** — ${r.id} — ${r.classification} — ${r.candidates.implementationCandidates.length} implementation candidates, ${r.candidates.markerCandidates.length} marker candidates, ${r.candidates.testCandidates.length} test candidates`)
].join('\n') + '\n');

console.log(`Reality Claim Resolver PASS — ${records.length} records resolved; ${JSON.stringify(counts)}.`);
