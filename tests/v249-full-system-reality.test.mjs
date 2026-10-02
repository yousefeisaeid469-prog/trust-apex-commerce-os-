import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/reality/full-system-reality-report.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(report.version, `V${pkg.version}`);
assert.ok(report.results.length >= 8);
assert.ok(report.counts.PROVEN >= 8);
assert.equal(report.counts.UNWIRED, 0, 'unwired claims must block reality proof');
assert.equal(report.counts.CONTRADICTED, 0, 'contradicted claims must block reality proof');
for (const result of report.results.filter(r => r.id.startsWith('v244-') || r.id === 'v245-domain-effects' || r.id === 'v246-registry-authority' || r.id === 'v247-schema-validation')) {
  assert.equal(result.status, 'PROVEN', `${result.id} is not proven`);
}
console.log(`V249 full-system reality test PASS — ${report.counts.PROVEN} proven records; no unwired or contradicted claims.`);
