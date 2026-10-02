import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const required = ['package-lock.json', 'next.config.mjs', 'tsconfig.json'];
for (const file of required) if (!existsSync(file)) throw new Error(`Missing ${file}`);

if (!existsSync('node_modules')) {
  console.error('VERIFY_BLOCKED: node_modules is missing. Run npm ci in the target environment.');
  process.exit(2);
}

const commands = [
  ['npm', ['run', 'typecheck']],
  ['npm', ['run', 'build']],
  ['npm', ['test']],
];

for (const [command, args] of commands) {
  console.log(`\n>>> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`VERIFY_FAILED: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nVERIFY_OK: typecheck, build and full test suite passed.');
