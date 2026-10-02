import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('config/reality/evidence-receipts-v259.json'));
const expectedVersion = `V${pkg.version}`;
if (manifest.version !== expectedVersion) throw new Error(`Receipt manifest version ${manifest.version} != ${expectedVersion}`);

function runTest(file) {
  if (!exists(file)) return { file, command: `node --experimental-strip-types ${file}`, exists: false, exitCode: null, stdout: '', stderr: 'missing test' };
  const r = spawnSync(process.execPath, ['--experimental-strip-types', file], { cwd: root, encoding: 'utf8', timeout: 30000 });
  return { file, command: `node --experimental-strip-types ${file}`, exists: true, exitCode: r.status, stdout: (r.stdout || '').trim().slice(-4000), stderr: (r.stderr || '').trim().slice(-4000) };
}

const receipts = manifest.claims.map(claim => {
  const artifactChecks = claim.artifacts.map(file => ({ file, exists: exists(file), sha256: exists(file) ? sha256(file) : null }));
  const markerChecks = claim.markers.map(marker => {
    const foundIn = claim.artifacts.filter(file => exists(file) && read(file).includes(marker));
    return { marker, foundIn };
  });
  const testChecks = claim.tests.map(runTest);
  const gates = {
    artifacts: artifactChecks.length > 0 && artifactChecks.every(x => x.exists && x.sha256),
    runtimeMarkers: markerChecks.length > 0 && markerChecks.every(x => x.foundIn.length > 0),
    regressionTests: testChecks.length > 0 && testChecks.every(x => x.exists && x.exitCode === 0)
  };
  return {
    id: claim.id,
    version: expectedVersion,
    generatedAt: new Date().toISOString(),
    status: Object.values(gates).every(Boolean) ? 'EVIDENCE_RECEIPT_VALID' : 'BLOCKED',
    gates,
    artifacts: artifactChecks,
    markers: markerChecks,
    tests: testChecks,
    promotionAllowed: false
  };
});

const out = {
  version: expectedVersion,
  generatedAt: new Date().toISOString(),
  schemaVersion: '1.0',
  policy: manifest.policy,
  integrity: 'SHA-256 artifact digests + exact marker presence + executable test exit status',
  counts: {
    receipts: receipts.length,
    valid: receipts.filter(r => r.status === 'EVIDENCE_RECEIPT_VALID').length,
    blocked: receipts.filter(r => r.status === 'BLOCKED').length,
    promotionAllowed: 0
  },
  receipts
};
if (out.counts.receipts !== 8) throw new Error(`Expected 8 receipts, got ${out.counts.receipts}`);
if (out.counts.valid !== 8) throw new Error(`Evidence receipts blocked: ${out.counts.blocked}`);
fs.mkdirSync(path.join(root, 'artifacts/reality/evidence-receipts'), { recursive: true });
for (const r of receipts) fs.writeFileSync(path.join(root, 'artifacts/reality/evidence-receipts', `${r.id}.json`), JSON.stringify(r, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-receipts.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'artifacts/reality/reality-evidence-receipts.md'), [
  `# TRUST ${expectedVersion} — Evidence Receipts`, '',
  out.policy, '',
  '## Integrity contract',
  '- Every artifact must exist and have a recorded SHA-256 digest.',
  '- Every runtime marker must be found in the claim-declared artifact set.',
  '- Every regression test must execute successfully in isolation.',
  '- Receipts are evidence records; they never auto-promote a claim.', '',
  '## Counts',
  `- Receipts: ${out.counts.receipts}`,
  `- Valid: ${out.counts.valid}`,
  `- Blocked: ${out.counts.blocked}`,
  `- Promotion allowed: ${out.counts.promotionAllowed}`
].join('\n') + '\n');
console.log(`Reality Evidence Receipt PASS — ${out.counts.valid}/${out.counts.receipts} valid; SHA-256 + exact markers + executable tests; 0 promoted.`);
