import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = f => fs.readFileSync(f, 'utf8');

test('release metadata remains internally consistent across future versions', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const expected = `V${pkg.version}`;
  const runtime = read('lib/runtime/version.ts').match(/TRUST_RUNTIME_VERSION\s*=\s*['"](V\d+\.\d+\.\d+)['"]/)?.[1];
  const manifest = JSON.parse(read('db/migrations/MANIFEST.json'));
  const master = read('MASTER-RELEASE.md');
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.equal(runtime, expected);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages?.['']?.version, pkg.version);
  assert.equal(manifest.version, expected);
  assert.equal(manifest.generatedFor, expected);
  assert.match(master, new RegExp(`^# TRUST ${expected.replaceAll('.', '\\.')}`, 'm'));
});
