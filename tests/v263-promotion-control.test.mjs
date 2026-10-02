import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const run = spawnSync(process.execPath, ['scripts/reality_promotion_control.mjs'], { cwd: process.cwd(), encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr || run.stdout);
const report = JSON.parse(fs.readFileSync('artifacts/reality/reality-promotion-control-v263.json', 'utf8'));
test('V263 binds every decision to the current attestation root', () => {
  assert.equal(report.version, 'V263.0.0');
  assert.equal(report.counts.considered, 4);
  assert.equal(report.counts.pendingExplicitReview, 4);
  assert.equal(report.counts.approved, 0);
  assert.equal(report.counts.promoted, 0);
  assert.equal(report.counts.promotionAllowed, 0);
  assert.match(report.attestationRoot, /^[a-f0-9]{64}$/);
  assert.match(report.decisionRoot, /^[a-f0-9]{64}$/);
  for (const d of report.decisions) {
    assert.equal(d.state, 'PENDING_EXPLICIT_REVIEW');
    assert.equal(d.requestedAction, 'NO_AUTO_PROMOTION');
    assert.equal(d.reviewer, null);
    assert.equal(d.attestationRoot, report.attestationRoot);
    assert.match(d.evidenceLeaf, /^[a-f0-9]{64}$/);
    assert.match(d.decisionHash, /^[a-f0-9]{64}$/);
  }
});
test('V263 cannot promote from attestation alone', () => {
  assert.equal(report.counts.promotionAllowed, 0);
  assert.ok(report.decisions.every(d => d.state !== 'APPROVED_FOR_PROMOTION' && d.state !== 'PROMOTED'));
});
console.log('V263 Promotion Control Test PASS — 4 decisions bound, 0 approved, 0 promoted.');
