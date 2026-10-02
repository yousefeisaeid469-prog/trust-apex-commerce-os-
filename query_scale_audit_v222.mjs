import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roots = ['app', 'modules', 'lib', 'db'];
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx|sql)$/.test(entry.name)) files.push(file);
  }
}
for (const dir of roots) walk(path.join(root, dir));

const hits = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (/SELECT\s+\*/i.test(source)) hits.push(`${path.relative(root, file)}: SELECT *`);
}
console.log(`TRUST V222 query scale audit — ${files.length} runtime source files scanned`);
if (hits.length) {
  console.log(`WARN — ${hits.length} production SELECT * pattern(s) require review`);
  hits.slice(0, 20).forEach(hit => console.log(`- ${hit}`));
} else {
  console.log('PASS — no production SELECT * patterns found.');
}
