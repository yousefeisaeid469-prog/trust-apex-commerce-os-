import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/reality_capability_evidence_executor.mjs'], {cwd: process.cwd(), encoding: 'utf8'});
assert.equal(run.status, 0, run.stderr || run.stdout);
const report = JSON.parse(fs.readFileSync('artifacts/reality/reality-capability-evidence-execution-v261.json', 'utf8'));

test('V261 executes an explicitly authored capability batch', () => {
  assert.equal(report.version, 'V261.0.0');
  assert.equal(report.counts.authored, 4);
  assert.equal(report.counts.executable, 4);
  assert.equal(report.counts.blocked, 0);
});

test('V261 evidence is source-pinned and never auto-promoted', () => {
  for (const receipt of report.receipts) {
    assert.equal(receipt.status, 'EXECUTABLE_EVIDENCE');
    assert.equal(receipt.promotionDecision, 'REQUIRES_SEPARATE_REVIEW');
    assert.ok(receipt.evidenceDigest);
    assert.ok(receipt.artifacts.every(a => a.sha256));
    assert.ok(receipt.markers.every(m => m.foundIn.length > 0));
    assert.ok(receipt.tests.every(t => t.exitCode === 0));
  }
  assert.equal(report.counts.promotionAllowed, 0);
});

console.log('V261 Capability Evidence Execution Test PASS — 4/4 executable, 0 blocked, 0 promoted.');
