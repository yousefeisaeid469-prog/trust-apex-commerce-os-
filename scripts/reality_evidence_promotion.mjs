import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const pkg = JSON.parse(read('package.json'));
const graph = JSON.parse(read('artifacts/reality/reality-evidence-graph.json'));
const ledger = JSON.parse(read('config/reality/release-claims-v248.json'));

function hasMarker(claim, marker) {
  return (claim.artifacts ?? []).some(file => exists(file) && read(file).includes(marker));
}
function evaluate(claim) {
  const artifacts = (claim.artifacts ?? []).filter(exists);
  const tests = (claim.tests ?? []).filter(exists);
  const markers = (claim.markers ?? []).filter(m => hasMarker(claim, m));
  const missingArtifacts = (claim.artifacts ?? []).filter(f => !exists(f));
  const missingTests = (claim.tests ?? []).filter(f => !exists(f));
  const missingMarkers = (claim.markers ?? []).filter(m => !hasMarker(claim, m));
  const ready = artifacts.length === (claim.artifacts ?? []).length &&
    tests.length === (claim.tests ?? []).length &&
    markers.length === (claim.markers ?? []).length &&
    artifacts.length > 0 && tests.length > 0 && markers.length > 0;
  return { ready, artifacts, tests, markers, missingArtifacts, missingTests, missingMarkers };
}

const promotions = (ledger.claims ?? []).map(claim => {
  const e = evaluate(claim);
  return {
    id: claim.id,
    claim: claim.claim,
    status: e.ready ? 'READY_FOR_PROMOTION' : 'BLOCKED',
    gate: {
      implementation: e.artifacts.length === (claim.artifacts ?? []).length && e.artifacts.length > 0,
      runtimeMarkers: e.markers.length === (claim.markers ?? []).length && e.markers.length > 0,
      regressionTests: e.tests.length === (claim.tests ?? []).length && e.tests.length > 0
    },
    missing: { artifacts: e.missingArtifacts, markers: e.missingMarkers, tests: e.missingTests }
  };
});

const documentedOnly = graph.nodes.map(n => ({
  id: n.id,
  source: n.source,
  line: n.line ?? null,
  text: n.text,
  status: 'BLOCKED_NO_STRUCTURED_CLAIM',
  reason: 'The source record is documentation-only and has no structured implementation/marker/test contract. It is not promoted by inference.'
}));

const out = {
  version: `V${pkg.version}`,
  generatedAt: new Date().toISOString(),
  policy: 'Promotion requires an explicit structured claim plus complete implementation, runtime-marker, and regression-test evidence. Lexical candidates never auto-promote.',
  counts: {
    structuredClaims: promotions.length,
    readyForPromotion: promotions.filter(x => x.status === 'READY_FOR_PROMOTION').length,
    blockedStructuredClaims: promotions.filter(x => x.status === 'BLOCKED').length,
    documentationOnlyQueue: documentedOnly.length
  },
  promotions,
  documentationOnlyQueue: documentedOnly
};

fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-promotion.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-promotion.md'), [
  `# TRUST ${out.version} — Reality Evidence Promotion`,
  '',
  `Generated: ${out.generatedAt}`,
  '',
  'Promotion is conservative: a record is promoted only when an explicit structured claim has all declared implementation artifacts, runtime markers, and regression tests. Documentation-only records are queued for contract authoring, never promoted by lexical inference.',
  '',
  '## Counts',
  `- Structured claims: ${out.counts.structuredClaims}`,
  `- Ready for promotion: ${out.counts.readyForPromotion}`,
  `- Blocked structured claims: ${out.counts.blockedStructuredClaims}`,
  `- Documentation-only queue: ${out.counts.documentationOnlyQueue}`,
  '',
  '## Structured claims',
  ...promotions.map(x => `- **${x.status}** — ${x.id} — implementation=${x.gate.implementation}, markers=${x.gate.runtimeMarkers}, tests=${x.gate.regressionTests}`),
  '',
  '## Documentation-only queue',
  ...documentedOnly.map(x => `- **${x.status}** — ${x.id} — ${x.text}`)
].join('\n') + '\n');

console.log(`Reality Evidence Promotion PASS — ${out.counts.structuredClaims} structured claims; ${out.counts.readyForPromotion} ready, ${out.counts.blockedStructuredClaims} blocked, ${out.counts.documentationOnlyQueue} documentation-only queued.`);
