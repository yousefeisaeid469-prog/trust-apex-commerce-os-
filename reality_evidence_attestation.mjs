import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const hashBytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashFile = file => hashBytes(fs.readFileSync(path.join(root, file)));
const pkg = JSON.parse(read('package.json'));
const config = JSON.parse(read('config/reality/evidence-attestation-v262.json'));
const expectedVersion = config.version;
if (!/^V\d+\.\d+\.\d+$/.test(expectedVersion)) throw new Error(`Invalid attestation version: ${expectedVersion}`);
if (config.version !== expectedVersion) throw new Error(`Attestation config ${config.version} != ${expectedVersion}`);
if (!exists(config.baseline)) throw new Error(`Missing baseline: ${config.baseline}`);
const baseline = JSON.parse(read(config.baseline));
if (baseline.counts?.authored !== config.capabilities.length) throw new Error('Baseline capability count mismatch');

const baselineMap = new Map(baseline.receipts.map(r => [r.id, r]));
const records = [];
for (const id of config.capabilities) {
  const receipt = baselineMap.get(id);
  if (!receipt) throw new Error(`Baseline receipt missing: ${id}`);
  if (receipt.status !== 'EXECUTABLE_EVIDENCE') throw new Error(`Baseline receipt not executable: ${id}`);
  const artifacts = receipt.artifacts.map(a => ({
    file: a.file,
    expectedSha256: a.sha256,
    actualSha256: exists(a.file) ? hashFile(a.file) : null,
    matches: exists(a.file) && hashFile(a.file) === a.sha256
  }));
  const tests = receipt.tests.map(t => {
    if (!exists(t.file)) return { file: t.file, exists: false, exitCode: null, matches: false };
    const result = spawnSync(process.execPath, ['--experimental-strip-types', t.file], { cwd: root, encoding: 'utf8', timeout: 30000 });
    return { file: t.file, exists: true, exitCode: result.status, matches: t.exitCode === result.status };
  });
  const artifactIntegrity = artifacts.every(a => a.matches);
  const testReplay = tests.every(t => t.exists && t.exitCode === 0 && t.matches);
  const status = artifactIntegrity && testReplay ? 'ATTESTED' : 'DRIFT_DETECTED';
  const leaf = hashBytes(JSON.stringify({ id, artifacts, tests }));
  records.push({ id, baselineEvidenceDigest: receipt.evidenceDigest, artifacts, tests, artifactIntegrity, testReplay, status, leaf });
}
const orderedLeaves = records.map(r => r.leaf).sort();
const attestationRoot = hashBytes(JSON.stringify({ version: expectedVersion, baseline: config.baseline, leaves: orderedLeaves }));
const out = {
  version: expectedVersion,
  schemaVersion: config.schemaVersion,
  generatedAt: new Date().toISOString(),
  policy: config.policy,
  baseline: config.baseline,
  counts: {
    checked: records.length,
    attested: records.filter(r => r.status === 'ATTESTED').length,
    driftDetected: records.filter(r => r.status === 'DRIFT_DETECTED').length,
    promotionAllowed: 0
  },
  attestationRoot,
  records
};
if (out.counts.driftDetected !== 0) throw new Error(`V262 attestation detected drift in ${out.counts.driftDetected} capabilities`);
fs.mkdirSync(path.join(root, 'artifacts/reality'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-attestation-v262.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-attestation-v262.md'), [
  `# TRUST ${expectedVersion} — Reality Evidence Attestation`, '', config.policy, '',
  `- Baseline: ${config.baseline}`,
  `- Checked: ${out.counts.checked}`,
  `- Attested: ${out.counts.attested}`,
  `- Drift detected: ${out.counts.driftDetected}`,
  `- Promotion allowed: ${out.counts.promotionAllowed}`,
  `- Attestation root: ${attestationRoot}`, '',
  ...records.map(r => `- **${r.status}** — ${r.id} — leaf=${r.leaf}`)
].join('\n') + '\n');
console.log(`V262 Reality Evidence Attestation PASS — ${out.counts.attested}/${out.counts.checked} attested; 0 drift; 0 promoted; root=${attestationRoot}`);
