import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json', 'next.config.mjs', 'tsconfig.json', 'app/layout.tsx', 'app/page.tsx',
  'app/globals.css', 'components/trust-os-shell.tsx', 'fixtures/catalog.ts',
  'lib/v63/tamper-evident-audit.ts'
];
const errors = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: ${file}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'next build') errors.push('Build script must be exactly: next build');
if (pkg.dependencies?.next !== '14.2.31') errors.push('Unexpected Next.js version');

const sourceDirs = ['app', 'components', 'data', 'lib'];
const sourceFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) sourceFiles.push(full);
  }
}
for (const dir of sourceDirs) walk(path.join(root, dir));

const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /(?:from|import\()\s*["'](\.\.?\/[^"']+)["']/g;
  let match;
  while ((match = re.exec(text))) {
    const target = path.resolve(path.dirname(file), match[1]);
    const exists = extensions.some(ext => fs.existsSync(target + ext)) ||
      ['index.ts','index.tsx','index.js','index.jsx'].some(name => fs.existsSync(path.join(target, name)));
    if (!exists) errors.push(`Broken relative import: ${path.relative(root, file)} -> ${match[1]}`);
  }
}

if (errors.length) {
  console.error(`TRUST preflight FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`TRUST preflight OK — ${sourceFiles.length} source files, required files present, relative imports resolved.`);
