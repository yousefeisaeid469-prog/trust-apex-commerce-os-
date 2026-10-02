import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const pkg = JSON.parse(read('package.json'));
const contracts = JSON.parse(read('artifacts/reality/reality-capability-contracts.json'));

function tokenize(text) {
  return [...new Set(text.toLowerCase().split(/[^a-z0-9_]+/).filter(t => t.length >= 7))].slice(0, 24);
}
function lineEvidence(file, token) {
  if (!exists(file)) return null;
  const lines = read(file).split(/\r?\n/);
  const needle = token.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(needle)) {
      return { file, line: i + 1, token, excerpt: lines[i].trim().slice(0, 240) };
    }
  }
  return null;
}
function walk(rel, out = []) {
  const dir = path.join(root, rel);
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.git','.next'].includes(ent.name)) continue;
    const child = path.join(rel, ent.name);
    if (ent.isDirectory()) walk(child, out);
    else if (/\.(mjs|ts|tsx)$/.test(ent.name)) out.push(child);
  }
  return out;
}
const sourceFiles = walk('.');
const testFiles = sourceFiles.filter(f => /(^|\/)tests\/.+\.test\.(mjs|ts)$/.test(f));

function resolve(contract) {
  const tokens = tokenize(contract.claim);
  const candidateArtifacts = contract.discoveryHints?.candidateArtifacts ?? [];
  const implementation = candidateArtifacts.filter(exists).slice(0, 8).map(file => ({ file, basis: 'candidate-artifact-exists' }));
  const runtime = [];
  for (const file of implementation.map(x => x.file)) {
    for (const token of tokens) {
      const hit = lineEvidence(file, token);
      if (hit) { runtime.push({ ...hit, basis: 'lexical-runtime-candidate' }); break; }
    }
  }
  const tests = [];
  for (const file of testFiles) {
    const lower = read(file).toLowerCase();
    const hits = tokens.filter(t => lower.includes(t));
    if (hits.length >= 2) tests.push({ file, hits: hits.slice(0, 8), basis: 'lexical-test-candidate' });
  }
  const explicit = contract.evidenceContract.implementationArtifacts.length > 0 &&
    contract.evidenceContract.runtimeMarkers.length > 0 &&
    contract.evidenceContract.regressionTests.length > 0;
  let status = 'BLOCKED';
  if (explicit) status = 'REQUIRES_EXECUTION';
  else if (implementation.length && (runtime.length || tests.length)) status = 'PARTIAL';
  else if (implementation.length) status = 'NEEDS_RUNTIME_AND_TEST';
  return {
    id: contract.id,
    sourceId: contract.sourceId,
    claim: contract.claim,
    ownerDomain: contract.ownerDomain,
    status,
    authoritativeEvidence: {
      implementationArtifacts: contract.evidenceContract.implementationArtifacts,
      runtimeMarkers: contract.evidenceContract.runtimeMarkers,
      regressionTests: contract.evidenceContract.regressionTests
    },
    discovery: { implementation, runtime, tests },
    promotionAllowed: false,
    reason: status === 'PARTIAL'
      ? 'Discovery found plausible implementation/runtime/test candidates, but the contract has no explicit authoritative evidence. Human-authored evidence is required before execution.'
      : status === 'NEEDS_RUNTIME_AND_TEST'
        ? 'Implementation candidate exists, but no sufficient runtime/test candidate was discovered.'
        : 'No authoritative evidence contract exists; discovery cannot establish proof.'
  };
}

const records = contracts.contracts.map(resolve);
const counts = Object.fromEntries([...new Set(records.map(r => r.status))].map(s => [s, records.filter(r => r.status === s).length]));
const out = {
  version: `V${pkg.version}`,
  generatedAt: new Date().toISOString(),
  schemaVersion: '1.0',
  policy: 'Discovery is forensic and non-authoritative. Candidate matches never become proof. Promotion is disabled until a contract contains explicit implementation artifacts, exact runtime markers, and executable regression tests.',
  counts: { total: records.length, ...counts, promotionAllowed: 0 },
  records
};
if (records.length !== 58) throw new Error(`Expected 58 capability contracts, got ${records.length}`);
if (out.counts.promotionAllowed !== 0) throw new Error('Resolver must never promote');
fs.mkdirSync(path.join(root,'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root,'artifacts/reality/reality-capability-evidence-resolution.json'), JSON.stringify(out,null,2)+'\n');
fs.writeFileSync(path.join(root,'artifacts/reality/reality-capability-evidence-resolution.md'), [
  `# TRUST ${out.version} — Capability Evidence Resolution`, '',
  `Generated: ${out.generatedAt}`, '', out.policy, '',
  '## Counts', ...Object.entries(out.counts).map(([k,v])=>`- ${k}: ${v}`), '',
  '## Status policy',
  '- `PARTIAL` means discovery found candidates; it is not proof.',
  '- `NEEDS_RUNTIME_AND_TEST` means implementation evidence is discoverable but runtime/test evidence is insufficient.',
  '- `BLOCKED` means there is no usable discovery chain.',
  '- `REQUIRES_EXECUTION` is reserved for explicitly authored contracts and still cannot auto-promote.', '',
  '## Records', ...records.map(r=>`- **${r.status}** — ${r.id} — implementation=${r.discovery.implementation.length}, runtime=${r.discovery.runtime.length}, tests=${r.discovery.tests.length}`)
].join('\n')+'\n');
console.log(`Capability Evidence Resolver PASS — ${records.length} contracts resolved; ${counts.PARTIAL ?? 0} partial; ${counts.BLOCKED ?? 0} blocked; 0 promoted.`);
