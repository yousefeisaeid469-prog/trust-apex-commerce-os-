import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));
const contracts = JSON.parse(read('artifacts/reality/reality-capability-contracts.json'));
const resolution = JSON.parse(read('artifacts/reality/reality-capability-evidence-resolution.json'));
const expectedVersion = `V${pkg.version}`;
const inputVersions = [contracts.version, resolution.version];
if (inputVersions.some(v => !/^V\d+\.0\.0$/.test(v))) {
  throw new Error(`Factory input version format invalid: ${inputVersions.join(', ')}`);
}
if (contracts.contracts.length !== 58 || resolution.records.length !== 58) {
  throw new Error('Factory requires exactly 58 capability contracts and 58 resolution records');
}

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const packetId = id => `evidence-packet:${id}`;
const required = ['implementationArtifacts','runtimeMarkers','regressionTests','failureCondition'];

function makePacket(contract, resolved) {
  const candidateFiles = [...new Set([
    ...(resolved.discovery?.implementation ?? []).map(x => x.file),
    ...(resolved.discovery?.runtime ?? []).map(x => x.file),
    ...(resolved.discovery?.tests ?? []).map(x => x.file),
  ])].slice(0, 16);
  return {
    id: packetId(contract.id),
    contractId: contract.id,
    sourceId: contract.sourceId,
    claim: contract.claim,
    ownerDomain: contract.ownerDomain,
    version: expectedVersion,
    status: 'BLOCKED_PENDING_EXPLICIT_EVIDENCE',
    execution: {
      state: 'NOT_ELIGIBLE',
      eligible: false,
      reason: 'Evidence slots are intentionally empty; discovery candidates cannot be executed as authoritative evidence.',
      requiredSequence: [
        'AUTHOR_IMPLEMENTATION_ARTIFACTS',
        'AUTHOR_EXACT_RUNTIME_MARKERS',
        'AUTHOR_EXECUTABLE_REGRESSION_TESTS',
        'VALIDATE_FAILURE_CONDITION',
        'EXECUTE_PACKET',
        'ISSUE_RECEIPT',
        'REQUEST_PROMOTION',
      ]
    },
    evidence: {
      implementationArtifacts: [],
      runtimeMarkers: [],
      regressionTests: [],
      failureCondition: 'BLOCKED_UNTIL_EXPLICIT_EVIDENCE'
    },
    discoveryOnly: {
      candidateArtifacts: candidateFiles,
      candidateRuntimeMarkers: (resolved.discovery?.runtime ?? []).slice(0, 8),
      candidateTests: (resolved.discovery?.tests ?? []).slice(0, 8)
    },
    integrity: {
      contractDigest: hash(JSON.stringify({id: contract.id, claim: contract.claim, sourceId: contract.sourceId})),
      evidenceDigest: hash(JSON.stringify({implementationArtifacts: [], runtimeMarkers: [], regressionTests: [], failureCondition: 'BLOCKED_UNTIL_EXPLICIT_EVIDENCE'}))
    },
    policy: 'Discovery candidates are hints only. This packet cannot execute or promote until every authoritative evidence slot is explicitly authored.'
  };
}

const packets = contracts.contracts.map((c, i) => makePacket(c, resolution.records[i]));
const counts = {
  total: packets.length,
  blockedPendingExplicitEvidence: packets.filter(p => p.status === 'BLOCKED_PENDING_EXPLICIT_EVIDENCE').length,
  eligible: packets.filter(p => p.execution.eligible).length,
  executed: 0,
  receiptsIssued: 0,
  promotionAllowed: 0
};
if (counts.blockedPendingExplicitEvidence !== 58 || counts.eligible !== 0) throw new Error('Factory must leave all 58 capability packets blocked until explicit evidence authoring');

const out = {
  version: expectedVersion,
  generatedAt: new Date().toISOString(),
  schemaVersion: '1.0',
  policy: 'The factory creates executable evidence packet contracts. It never promotes, never treats discovery as proof, and never executes a packet with incomplete authoritative evidence.',
  counts,
  packets
};
fs.mkdirSync(path.join(root, 'artifacts/reality/evidence-packets'), {recursive:true});
for (const packet of packets) fs.writeFileSync(path.join(root, 'artifacts/reality/evidence-packets', `${packet.contractId}.json`), JSON.stringify(packet,null,2)+'\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-factory.json'), JSON.stringify(out,null,2)+'\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-factory.md'), [
  `# TRUST ${expectedVersion} — Reality Evidence Execution Factory`, '',
  out.policy, '',
  '## Pipeline',
  '1. Explicitly author implementation artifacts.',
  '2. Explicitly author exact runtime markers/entrypoints.',
  '3. Explicitly author executable regression tests.',
  '4. Validate the failure condition.',
  '5. Execute only eligible packets.',
  '6. Issue a cryptographic evidence receipt.',
  '7. Request promotion through the existing promotion gate.', '',
  '## Counts',
  ...Object.entries(counts).map(([k,v]) => `- ${k}: ${v}`), '',
  '## Safety boundary',
  '- Discovery candidates are copied into a separate `discoveryOnly` section.',
  '- Authoritative evidence arrays remain empty for all 58 packets.',
  '- No packet is executable and no packet can promote.', '',
  '## Packet IDs',
  ...packets.map(p => `- **${p.id}** — ${p.ownerDomain} — BLOCKED_PENDING_EXPLICIT_EVIDENCE`)
].join('\n')+'\n');
console.log(`Reality Evidence Execution Factory PASS — ${counts.total} packets created; ${counts.eligible} eligible; ${counts.executed} executed; ${counts.promotionAllowed} promotion allowed.`);
