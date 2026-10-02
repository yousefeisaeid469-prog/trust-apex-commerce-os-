import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tests = readdirSync(join(root, 'tests'))
  .filter(name => /\.(mjs|ts)$/.test(name))
  .sort()
  .map(name => join('tests', name));

if (!tests.length) {
  console.error('No test files found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', ...tests], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
