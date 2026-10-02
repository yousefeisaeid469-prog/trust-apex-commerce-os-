import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const sourceDirs=['app','modules','lib','scripts'];
const files=[];
function walk(dir){if(!fs.existsSync(path.join(root,dir)))return;for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){if(['node_modules','.next','.git'].includes(e.name))continue;const rel=path.join(dir,e.name);if(e.isDirectory())walk(rel);else if(/\.(ts|tsx|js|jsx|mjs)$/.test(e.name))files.push(rel)}}
sourceDirs.forEach(walk);
const forbiddenPatterns=[
  /from\s+['"].*autonomous-commerce-orchestrator[\\/]core\.ts['"]/,
  /from\s+['"].*event-driven-execution-fabric[\\/]core\.ts['"]/,
  /require\(['"].*autonomous-commerce-orchestrator[\\/]core\.ts['"]\)/
];
const violations=[];
for(const file of files){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  if(file.startsWith('tests'+path.sep) || file === 'modules/platform/autonomous-commerce-orchestrator/core.ts') continue;
  for(const re of forbiddenPatterns) if(re.test(text)) violations.push(`${file}:${re}`);
}
const legacy=path.join(root,'modules/platform/autonomous-commerce-orchestrator/core.ts');
if(!fs.existsSync(legacy)) violations.push('MISSING:legacy compatibility boundary');
else {
 const text=fs.readFileSync(legacy,'utf8');
 if(!text.includes('LEGACY_COMPATIBILITY_PATH')) violations.push('LEGACY_CORE_NOT_MARKED_COMPATIBILITY');
}
const report={version:'V251.0.0',generatedAt:new Date().toISOString(),policy:'Production code must enter autonomous orchestration through the durable PostgreSQL boundary; legacy process-local orchestration remains test/compatibility-only.',violations,legacyCompatibility:'modules/platform/autonomous-commerce-orchestrator/core.ts'};
fs.mkdirSync(path.join(root,'artifacts/reality'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/reality/legacy-runtime-surface-report.json'),JSON.stringify(report,null,2)+'\n');
if(violations.length){console.error(`Legacy runtime surface audit FAILED (${violations.length})`);violations.forEach(v=>console.error('- '+v));process.exit(1)}
console.log('Legacy runtime surface audit PASS — no production source imports the process-local orchestrator/event-fabric path.');
