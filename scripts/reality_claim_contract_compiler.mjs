import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const pkg = JSON.parse(read('package.json'));
const resolution = JSON.parse(read('artifacts/reality/reality-claim-resolution.json'));

const capabilityRecords = (resolution.records ?? []).filter(r => r.classification === 'CAPABILITY_CLAIM');

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'capability';
}

function ownerDomain(record) {
  const files = record.candidates?.implementationCandidates ?? [];
  const joined = files.join(' ').toLowerCase();
  if (joined.includes('payment')) return 'payments';
  if (joined.includes('inventory')) return 'inventory';
  if (joined.includes('fulfillment')) return 'fulfillment';
  if (joined.includes('consumer')) return 'commerce-consumers';
  if (joined.includes('event')) return 'events';
  if (joined.includes('orchestrat')) return 'orchestration';
  if (joined.includes('security')) return 'security';
  if (joined.includes('reliability')) return 'reliability';
  if (joined.includes('deployment')) return 'deployment';
  if (joined.includes('revenue')) return 'revenue';
  return 'unassigned';
}

const contracts = capabilityRecords.map((record, index) => ({
  id: `capability-${String(index + 1).padStart(3, '0')}-${slug(record.claim)}`,
  sourceId: record.id,
  claim: record.claim,
  lifecycle: 'DRAFT',
  ownerDomain: ownerDomain(record),
  evidenceContract: {
    implementationArtifacts: [],
    runtimeMarkers: [],
    regressionTests: [],
    failureCondition: 'BLOCKED_UNTIL_EXPLICIT_EVIDENCE',
    minimumProof: ['one explicit implementation artifact', 'one exact runtime marker or observable entrypoint', 'one executable regression test']
  },
  discoveryHints: {
    candidateArtifacts: (record.candidates?.implementationCandidates ?? []).filter(exists).slice(0, 8),
    lexicalMarkers: (record.candidates?.markerCandidates ?? []).slice(0, 12).map(x => ({ file: x.file, marker: x.marker }))
  },
  policy: 'Discovery hints are non-authoritative. A human-authored contract must replace them with explicit evidence references before execution or promotion.'
}));

const duplicateIds = new Set();
for (const c of contracts) {
  if (duplicateIds.has(c.id)) throw new Error(`Duplicate contract id: ${c.id}`);
  duplicateIds.add(c.id);
}

const out = {
  version: `V${pkg.version}`,
  generatedAt: new Date().toISOString(),
  schemaVersion: '1.0',
  policy: 'The compiler turns capability-resolution records into explicit contract shells. It never infers proof, never fills authoritative runtime markers/tests from lexical candidates, and never promotes a claim.',
  counts: {
    inputCapabilityClaims: capabilityRecords.length,
    compiledContracts: contracts.length,
    readyForExecution: contracts.filter(c => c.evidenceContract.implementationArtifacts.length && c.evidenceContract.runtimeMarkers.length && c.evidenceContract.regressionTests.length).length,
    blockedPendingAuthoring: contracts.length
  },
  contracts
};

if (out.counts.inputCapabilityClaims !== 58) throw new Error(`Expected 58 capability claims, got ${out.counts.inputCapabilityClaims}`);
if (out.counts.compiledContracts !== 58) throw new Error(`Expected 58 compiled contracts, got ${out.counts.compiledContracts}`);
if (out.counts.readyForExecution !== 0) throw new Error('Compiler must not auto-author evidence');

fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-capability-contracts.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-capability-contracts.md'), [
  `# TRUST ${out.version} — Reality Capability Contract Compiler`, '',
  `Generated: ${out.generatedAt}`, '',
  out.policy, '',
  '## Counts',
  `- Input capability claims: ${out.counts.inputCapabilityClaims}`,
  `- Compiled contract shells: ${out.counts.compiledContracts}`,
  `- Ready for execution: ${out.counts.readyForExecution}`,
  `- Blocked pending explicit authoring: ${out.counts.blockedPendingAuthoring}`, '',
  '## Required contract evidence',
  '- Explicit implementation artifact(s).',
  '- Exact runtime marker or observable entrypoint.',
  '- Executable regression test.',
  '- Explicit failure condition.',
  '',
  '## Safety rule',
  'Candidate artifacts and lexical markers are discovery hints only. They are deliberately excluded from the authoritative evidence fields.',
  '',
  '## Contract IDs',
  ...contracts.map(c => `- **${c.id}** — ${c.ownerDomain} — DRAFT — ${c.claim}`)
].join('\n') + '\n');

console.log(`Reality Capability Contract Compiler PASS — ${out.counts.compiledContracts} contracts compiled; 0 auto-authored; 0 ready for execution.`);
