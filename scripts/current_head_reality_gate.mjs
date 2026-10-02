import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const exists = p => fs.existsSync(path.join(root, p));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const pkg = JSON.parse(read('package.json'));
const runtime = read('lib/runtime/version.ts').match(/V\d+\.\d+\.\d+/)?.[0];
if (runtime !== `V${pkg.version}`) failures.push(`version mismatch: runtime=${runtime}, package=V${pkg.version}`);

for (const cmd of [['node','scripts/migration_check.mjs'],['node','scripts/version_consistency_audit.mjs']]) {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) failures.push(`${cmd.join(' ')} failed: ${(r.stderr || r.stdout).trim().split('\n').slice(-4).join(' | ')}`);
}

const mustExist = [
  'app/api/wishlist/route.ts',
  'modules/marketplace/customer-retention.ts',
  'modules/commerce/payments/orchestrator.ts',
  'modules/commerce/core/execution-kernel.ts',
  'modules/platform/commerce-events/core.ts',
  'modules/platform/durable-events/reliability-fabric.ts',
  'modules/platform/durable-events/reliability-recovery.ts',
  'modules/platform/autonomous-commerce-orchestrator/durable.ts',
  'modules/platform/autonomous-commerce-orchestrator/consumer.ts',
  'app/api/autonomous-commerce-orchestrator/route.ts',
  'modules/commerce/consumers/intelligence.ts',
];
for (const p of mustExist) if (!exists(p)) failures.push(`missing runtime asset: ${p}`);

// Conservative local-import integrity scan for relative TS/TSX/MJS imports.
const roots = ['app','components','modules','scripts'];
const files = [];
function walk(dir){
  for(const ent of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    const rel=path.join(dir,ent.name);
    if(ent.isDirectory() && !['node_modules','.next'].includes(ent.name)) walk(rel);
    else if(ent.isFile() && /\.(ts|tsx|mjs|js)$/.test(ent.name)) files.push(rel);
  }
}
for(const dir of roots) if(exists(dir)) walk(dir);
const exts=['','.ts','.tsx','.mjs','.js','/index.ts','/index.tsx','/index.mjs','/index.js'];
for(const file of files){
  const src=read(file);
  for(const m of src.matchAll(/(?:from\s+|import\s*\()(['"])(\.\.?\/[^'"]+)\1/g)){
    const spec=m[2]; if(spec.includes('node_modules')) continue;
    const base=path.normalize(path.join(path.dirname(file),spec));
    if(!exts.some(ext=>exists(base+ext))) failures.push(`missing local import: ${file} -> ${spec}`);
  }
}

// Current-head smoke tests only. Historical release tests are intentionally excluded.
const smoke = [
  'tests/v296-global-commerce.test.mjs',
  'tests/v297-global-commerce-runtime.test.mjs',
  'tests/v360-event-backbone.test.mjs',
  'tests/v363-current-head-reality.test.mjs',
  'tests/v364-real-commerce-wiring.test.mjs',
  'tests/v367-consumer-execution.test.mjs',
  'tests/v368-consumer-control-plane.test.mjs',
  'tests/v369-operations-brain.test.mjs',
  'tests/v370-command-center.test.mjs',
  'tests/v371-verified-recovery.test.mjs',
  'tests/v372-reliability-fabric.test.mjs',
  'tests/v373-verified-order-recovery.test.mjs',
];
for(const test of smoke){
  if(!exists(test)){ failures.push(`missing current smoke test: ${test}`); continue; }
  const r=spawnSync(process.execPath,['--experimental-strip-types','--test',test],{cwd:root,encoding:'utf8'});
  if(r.status!==0) failures.push(`current smoke failed: ${test}`);
}

if(failures.length){
  console.error(`CURRENT HEAD REALITY GATE FAILED (${failures.length})`);
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log(`CURRENT HEAD REALITY GATE PASS — V${pkg.version}; canonical migrations, version alignment, local imports, and current runtime smoke suite verified.`);
