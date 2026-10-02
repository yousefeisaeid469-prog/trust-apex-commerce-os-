import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('config/reality/capability-evidence-v261.json'));
const expectedVersion = `V${pkg.version}`;
if (manifest.version !== expectedVersion) throw new Error(`Capability evidence manifest ${manifest.version} != ${expectedVersion}`);
if (manifest.capabilities.length !== 4) throw new Error('V261 explicit execution batch must contain exactly 4 capabilities');

function executeTest(file) {
  if (!exists(file)) return { file, exists: false, exitCode: null, stdout: '', stderr: 'missing test' };
  const result = spawnSync(process.execPath, ['--experimental-strip-types', file], {
    cwd: root, encoding: 'utf8', timeout: 30000
  });
  return { file, exists: true, exitCode: result.status, stdout: (result.stdout || '').trim().slice(-4000), stderr: (result.stderr || '').trim().slice(-4000) };
}

const receipts = manifest.capabilities.map(capability => {
  const artifacts = capability.artifacts.map(file => ({ file, exists: exists(file), sha256: exists(file) ? sha256(file) : null }));
  const markers = capability.runtimeMarkers.map(marker => ({
    marker,
    foundIn: capability.artifacts.filter(file => exists(file) && read(file).includes(marker))
  }));
  const tests = capability.tests.map(executeTest);
  const gates = {
    artifacts: artifacts.length > 0 && artifacts.every(x => x.exists && x.sha256),
    runtimeMarkers: markers.length > 0 && markers.every(x => x.foundIn.length > 0),
    regressionTests: tests.length > 0 && tests.every(x => x.exists && x.exitCode === 0)
  };
  const executable = Object.values(gates).every(Boolean);
  const evidenceDigest = crypto.createHash('sha256').update(JSON.stringify({
    id: capability.id,
    artifacts: artifacts.map(x => [x.file, x.sha256]),
    markers: markers.map(x => [x.marker, x.foundIn]),
    tests: tests.map(x => [x.file, x.exitCode])
  })).digest('hex');
  return {
    id: capability.id,
    version: expectedVersion,
    status: executable ? 'EXECUTABLE_EVIDENCE' : 'BLOCKED',
    promotionDecision: 'REQUIRES_SEPARATE_REVIEW',
    gates,
    artifacts,
    markers,
    tests,
    failureCondition: capability.failureCondition,
    evidenceDigest
  };
});

const out = {
  version: expectedVersion,
  generatedAt: new Date().toISOString(),
  schemaVersion: '1.0',
  policy: manifest.policy,
  counts: {
    authored: receipts.length,
    executable: receipts.filter(x => x.status === 'EXECUTABLE_EVIDENCE').length,
    blocked: receipts.filter(x => x.status === 'BLOCKED').length,
    promotionRequested: 0,
    promotionAllowed: 0
  },
  receipts
};
if (out.counts.executable !== receipts.length || out.counts.blocked !== 0) {
  throw new Error(`V261 evidence execution blocked ${out.counts.blocked}/${receipts.length} capabilities`);
}
if (out.counts.promotionAllowed !== 0) throw new Error('V261 executor cannot promote capabilities');
fs.mkdirSync(path.join(root, 'artifacts/reality/capability-evidence-v261'), { recursive: true });
for (const receipt of receipts) {
  fs.writeFileSync(path.join(root, 'artifacts/reality/capability-evidence-v261', `${receipt.id}.json`), JSON.stringify(receipt, null, 2) + '\n');
}
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-capability-evidence-execution-v261.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-capability-evidence-execution-v261.md'), [
  `# TRUST ${expectedVersion} — Capability Evidence Execution`, '',
  out.policy, '',
  '## Executed batch',
  `- Authored capabilities: ${out.counts.authored}`,
  `- Executable evidence: ${out.counts.executable}`,
  `- Blocked: ${out.counts.blocked}`,
  `- Promotion allowed: ${out.counts.promotionAllowed}`, '',
  '## Safety boundary',
  '- Evidence is explicit and source-pinned.',
  '- Runtime markers must exist in declared implementation artifacts.',
  '- Regression tests execute in isolation.',
  '- Successful execution does not auto-promote a capability.', '',
  ...receipts.map(r => `- **${r.status}** — ${r.id} — digest=${r.evidenceDigest}`)
].join('\n') + '\n');
console.log(`V261 Capability Evidence Executor PASS — ${out.counts.executable}/${out.counts.authored} executable; 0 blocked; 0 promoted.`);
