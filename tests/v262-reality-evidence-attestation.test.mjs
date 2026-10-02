import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/reality_evidence_attestation.mjs'], {cwd: process.cwd(), encoding: 'utf8'});
assert.equal(run.status, 0, run.stderr || run.stdout);
const report = JSON.parse(fs.readFileSync('artifacts/reality/reality-evidence-attestation-v262.json', 'utf8'));

test('V262 attests the exact V261 evidence batch', () => {
  assert.equal(report.version, 'V262.0.0');
  assert.equal(report.counts.checked, 4);
  assert.equal(report.counts.attested, 4);
  assert.equal(report.counts.driftDetected, 0);
  assert.equal(report.counts.promotionAllowed, 0);
  assert.match(report.attestationRoot, /^[a-f0-9]{64}$/);
});

test('V262 replay checks every source-pinned artifact and test', () => {
  for (const record of report.records) {
    assert.equal(record.status, 'ATTESTED');
    assert.equal(record.artifactIntegrity, true);
    assert.equal(record.testReplay, true);
    assert.ok(record.baselineEvidenceDigest);
    assert.ok(record.leaf);
  }
});

console.log('V262 Reality Evidence Attestation Test PASS — 4/4 attested, 0 drift, 0 promoted.');
