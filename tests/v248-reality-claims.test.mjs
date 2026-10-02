import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'config/reality/release-claims-v248.json'), 'utf8'));
assert.equal(ledger.version, 'V248.0.0');
assert.ok(ledger.claims.length >= 8);
for (const claim of ledger.claims) {
  assert.ok(claim.id);
  assert.ok(claim.artifacts.length > 0);
  assert.ok(claim.markers.length > 0);
  assert.ok(claim.tests.length > 0);
  for (const file of claim.artifacts) assert.ok(fs.existsSync(path.join(root, file)), `${claim.id}: ${file}`);
  for (const test of claim.tests) assert.ok(fs.existsSync(path.join(root, test)), `${claim.id}: ${test}`);
  for (const marker of claim.markers) {
    assert.ok(claim.artifacts.some(file => fs.readFileSync(path.join(root, file), 'utf8').includes(marker)), `${claim.id}: ${marker}`);
  }
}
console.log(`V248 reality claims PASS — ${ledger.claims.length} claims have executable evidence chains.`);
