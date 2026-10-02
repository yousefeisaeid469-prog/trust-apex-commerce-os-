import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const runtimeText = read('lib/runtime/version.ts');
const runtime = runtimeText.match(/TRUST_RUNTIME_VERSION\s*=\s*[\"'](V\d+\.\d+\.\d+)[\"']/)?.[1];
const manifest = JSON.parse(read('db/migrations/MANIFEST.json'));
const master = read('MASTER-RELEASE.md');
const expected = `V${pkg.version}`;
const issues = [];
if (!runtime) issues.push('lib/runtime/version.ts: TRUST_RUNTIME_VERSION is missing');
if (runtime && runtime !== expected) issues.push(`runtime=${runtime}, package=${expected}`);
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) issues.push(`package-lock=${lock.version}/${lock.packages?.['']?.version}, package=${pkg.version}`);
if (manifest.version !== expected || manifest.generatedFor !== expected) issues.push(`migration manifest=${manifest.version}/${manifest.generatedFor}, expected=${expected}`);
if (!new RegExp(`^# TRUST ${expected.replaceAll('.', '\\.')}`, 'm').test(master)) issues.push('MASTER-RELEASE.md heading does not match current version');
if (issues.length) {
  console.error(`Version consistency audit FAILED (${issues.length})`);
  issues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}
console.log(`Version consistency audit PASS — ${expected} is aligned across package, lockfile, runtime, migration manifest, and MASTER-RELEASE.`);
