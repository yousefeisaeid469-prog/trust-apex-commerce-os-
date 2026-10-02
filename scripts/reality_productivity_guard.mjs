import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const readJson = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
const PRODUCT_ROOTS = ['app','components','lib','modules','db/migrations'];
const NON_PRODUCT_ROOTS = ['scripts','docs','artifacts/reality','config/reality','tests'];
const EXT = new Set(['.ts','.tsx','.js','.mjs','.sql','.css','.json']);

function walk(rel, out=[]) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return out;
  for (const ent of fs.readdirSync(abs, {withFileTypes:true})) {
    const p = path.join(rel, ent.name);
    if (ent.isDirectory()) walk(p,out);
    else if (EXT.has(path.extname(ent.name))) out.push(p.replaceAll(path.sep,'/'));
  }
  return out;
}
function surfaceFiles(roots) { return [...new Set(roots.flatMap(r=>walk(r)))].sort(); }
function snapshot(roots) { return Object.fromEntries(surfaceFiles(roots).map(f=>[f,sha(f)])); }
function diff(before, after) {
  const keys = new Set([...Object.keys(before),...Object.keys(after)]);
  const changed=[];
  for (const k of [...keys].sort()) if (before[k] !== after[k]) changed.push(k);
  return changed;
}

const baselineFile = 'artifacts/reality/productivity-baseline-v269.json';
const current = readJson('package.json');
if (!fs.existsSync(path.join(root, baselineFile))) {
  const baseline = { version:'V269.0.0', createdAt:new Date().toISOString(), productive:snapshot(PRODUCT_ROOTS), nonProductive:snapshot(NON_PRODUCT_ROOTS) };
  fs.mkdirSync(path.join(root,'artifacts/reality'),{recursive:true});
  fs.writeFileSync(path.join(root,baselineFile),JSON.stringify(baseline,null,2)+'\n');
  console.log('Productivity Guard BASELINE_CREATED — V269 establishes the productive surface baseline.');
  process.exit(0);
}
const baseline = readJson(baselineFile);
const productiveNow=snapshot(PRODUCT_ROOTS);
const nonProductiveNow=snapshot(NON_PRODUCT_ROOTS);
const productiveChanged=diff(baseline.productive,productiveNow);
const nonProductiveChanged=diff(baseline.nonProductive,nonProductiveNow);
const sameReleaseBaseline = baseline.version === `V${current.version}`;
const auditOnly = !sameReleaseBaseline && productiveChanged.length===0 && nonProductiveChanged.length>0;
const report={version:`V${current.version}`,baselineVersion:baseline.version,productiveChanged,nonProductiveChanged,auditOnlyRelease:auditOnly,policy:'A release that changes only audit/evidence/governance surfaces is not productive progress.'};
fs.writeFileSync(path.join(root,'artifacts/reality/productivity-guard-report.json'),JSON.stringify(report,null,2)+'\n');
if (auditOnly) {
  console.error(`PRODUCTIVITY_LOOP_DETECTED — V${current.version} changes no productive surface; refusing another audit-only release.`);
  console.error('Implement a real product/runtime capability or stop and report the loop to the user.');
  process.exit(2);
}
console.log(`Productivity Guard PASS — productive changes: ${productiveChanged.length}; non-productive changes: ${nonProductiveChanged.length}.`);
