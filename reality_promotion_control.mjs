import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, v) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), v); };
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const pkg = JSON.parse(read('package.json'));
const expectedVersion = `V${pkg.version}`;
const cfg = JSON.parse(read('config/reality/promotion-control-v263.json'));
if (cfg.version !== expectedVersion) throw new Error(`Control config ${cfg.version} != ${expectedVersion}`);
const attestation = JSON.parse(read(cfg.attestation));
if (attestation.counts?.promotionAllowed !== 0) throw new Error('Attestation must not allow promotion');
if (attestation.counts?.driftDetected !== 0 || attestation.counts?.attested !== attestation.counts?.checked) throw new Error('Attestation is not clean');
const byId = new Map((attestation.records ?? []).map(r => [r.id, r]));
const decisions = cfg.capabilities.map((id, index) => {
  const record = byId.get(id);
  if (!record) throw new Error(`Missing attested capability: ${id}`);
  const decision = {
    decisionId: `v263-decision-${String(index + 1).padStart(3, '0')}`,
    capabilityId: id,
    state: 'PENDING_EXPLICIT_REVIEW',
    attestationRoot: attestation.attestationRoot,
    evidenceLeaf: record.leaf,
    baselineEvidenceDigest: record.baselineEvidenceDigest,
    requestedAction: 'NO_AUTO_PROMOTION',
    reviewer: null,
    rationale: 'Awaiting an explicit authorized promotion decision; attestation alone is not sufficient.',
    createdBy: 'TRUST-V263-PROMOTION-CONTROL-PLANE'
  };
  decision.decisionHash = hash(JSON.stringify(decision));
  return decision;
});
const rootHash = hash(JSON.stringify({ version: expectedVersion, attestationRoot: attestation.attestationRoot, decisions: decisions.map(d => d.decisionHash) }));
const out = {
  version: expectedVersion,
  schemaVersion: cfg.schemaVersion,
  generatedAt: new Date().toISOString(),
  policy: cfg.policy,
  attestation: cfg.attestation,
  attestationRoot: attestation.attestationRoot,
  counts: { considered: decisions.length, pendingExplicitReview: decisions.length, approved: 0, promoted: 0, rejected: 0, promotionAllowed: 0 },
  decisionRoot: rootHash,
  decisions
};
write('artifacts/reality/reality-promotion-control-v263.json', JSON.stringify(out, null, 2) + '\n');
write('artifacts/reality/reality-promotion-control-v263.md', [
`# TRUST ${expectedVersion} — Promotion Control Plane`, '', cfg.policy, '',
`- Attestation root: ${attestation.attestationRoot}`,
`- Considered: ${out.counts.considered}`,
`- Pending explicit review: ${out.counts.pendingExplicitReview}`,
`- Approved: ${out.counts.approved}`,
`- Promoted: ${out.counts.promoted}`,
`- Promotion allowed: ${out.counts.promotionAllowed}`,
`- Decision root: ${rootHash}`, '',
...decisions.map(d => `- **${d.state}** — ${d.capabilityId} — decision=${d.decisionId} — hash=${d.decisionHash}`)
].join('\n') + '\n');
console.log(`V263 Promotion Control Plane PASS — ${decisions.length} pending explicit review; 0 approved; 0 promoted; root=${rootHash}`);
