import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const pkg = JSON.parse(read('package.json'));
const ledger = JSON.parse(read('config/reality/release-claims-v248.json'));
const resolution = JSON.parse(read('artifacts/reality/reality-claim-resolution.json'));

function probeClaim(claim) {
  const artifactChecks = claim.artifacts.map(file => ({ file, exists: exists(file) }));
  const markerChecks = claim.markers.map(marker => {
    const hits = claim.artifacts.filter(file => exists(file) && read(file).includes(marker));
    return { marker, foundIn: hits };
  });
  const testChecks = claim.tests.map(file => {
    if (!exists(file)) return { file, exists: false, executed: false, exitCode: null, stdout: '', stderr: 'missing test' };
    const r = spawnSync(process.execPath, ['--experimental-strip-types', file], { cwd: root, encoding: 'utf8', timeout: 20000 });
    return { file, exists: true, executed: true, exitCode: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
  });
  const implementation = artifactChecks.length > 0 && artifactChecks.every(x => x.exists);
  const runtimeMarkers = markerChecks.length > 0 && markerChecks.every(x => x.foundIn.length > 0);
  const regressionTests = testChecks.length > 0 && testChecks.every(x => x.exists && x.executed && x.exitCode === 0);
  return {
    id: claim.id,
    claim: claim.claim,
    gates: { implementation, runtimeMarkers, regressionTests },
    status: implementation && runtimeMarkers && regressionTests ? 'EVIDENCE_EXECUTED' : 'BLOCKED',
    artifacts: artifactChecks,
    markers: markerChecks,
    tests: testChecks
  };
}

const results = ledger.claims.map(probeClaim);
const queue = resolution.records.filter(r => r.classification === 'CAPABILITY_CLAIM');
const out = {
  version: `V${pkg.version}`,
  generatedAt: new Date().toISOString(),
  policy: 'Execution harness runs only the explicit structured ledger. It requires existing implementation artifacts, exact runtime-marker hits, and executable regression tests. It never promotes documentation-only records or lexical candidates.',
  counts: {
    structuredClaims: results.length,
    evidenceExecuted: results.filter(r => r.status === 'EVIDENCE_EXECUTED').length,
    blocked: results.filter(r => r.status === 'BLOCKED').length,
    capabilityDraftsExcluded: queue.length,
    autoPromoted: 0
  },
  results
};

if (out.counts.autoPromoted !== 0) throw new Error('Execution harness must never auto-promote claims');
if (out.counts.blocked !== 0) throw new Error(`Structured evidence execution blocked ${out.counts.blocked} claims`);
if (out.counts.evidenceExecuted !== results.length) throw new Error('Not all structured claims produced executable evidence');

fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-execution.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-execution.md'), [
  `# TRUST ${out.version} — Reality Evidence Execution`, '',
  `Generated: ${out.generatedAt}`, '', out.policy, '',
  '## Results',
  `- Structured claims executed: ${out.counts.structuredClaims}`,
  `- Evidence chains executed successfully: ${out.counts.evidenceExecuted}`,
  `- Blocked: ${out.counts.blocked}`,
  `- Capability drafts deliberately excluded: ${out.counts.capabilityDraftsExcluded}`,
  `- Auto-promoted: ${out.counts.autoPromoted}`, '',
  '## Execution contract',
  '- Implementation artifacts must exist.',
  '- Every declared runtime marker must be found in the declared artifact set.',
  '- Every declared regression test must execute successfully in isolation.',
  '- Passing this harness produces executable evidence; promotion remains a separate policy decision.',
  '',
  '## Claims',
  ...results.map(r => `- **${r.status}** — ${r.id} — implementation=${r.gates.implementation}, markers=${r.gates.runtimeMarkers}, tests=${r.gates.regressionTests}`)
].join('\n') + '\n');

console.log(`Reality Evidence Execution PASS — ${out.counts.evidenceExecuted}/${out.counts.structuredClaims} structured claims executed; ${out.counts.capabilityDraftsExcluded} capability drafts excluded; 0 auto-promoted.`);
