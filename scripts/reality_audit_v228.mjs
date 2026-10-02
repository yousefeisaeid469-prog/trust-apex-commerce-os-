import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const app = path.join(root, 'app');
const registry = fs.readFileSync(path.join(root, 'modules/platform/feature-surfaces.ts'), 'utf8');
const pages = [];
function walk(dir){
  for(const name of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,name.name);
    if(name.isDirectory()) walk(full);
    else if(name.name==='page.tsx') pages.push(full);
  }
}
walk(app);
const tiny=[];
for(const file of pages){
  const lines=fs.readFileSync(file,'utf8').split(/\r?\n/).length;
  if(lines<=13) tiny.push({file:path.relative(root,file),lines});
}
const registryRoutes=[...registry.matchAll(/^\s*'([^']+)':\s*\{/gm)].map(m=>m[1]);
const unresolved=tiny.filter(x=>{
  const route='/' + path.relative(path.join(root,'app'),path.dirname(path.join(root,x.file))).replaceAll(path.sep,'/').replace(/^\//,'');
  return route!=='/' && !registryRoutes.includes(route) && !route.includes('/admin') && !['/admin-login','/owner-control-room','/merchant-verification-admin','/protection-admin','/life-os-admin','/discovery/admin','/decision-fabric-admin','/production-integrity-admin','/problem-solver-admin'].includes(route);
});
const domainFiles = [
  'components/domains/orders-surface.tsx','components/domains/agents-surface.tsx','components/domains/reliability-surface.tsx',
  'components/domains/decision-surface.tsx','components/domains/ai-quality-surface.tsx','components/domains/finance-surface.tsx',
  'components/domains/merchant-network-surface.tsx','components/domains/payment-surface.tsx'
];
const genericSurfacePages=pages.filter(file=>fs.readFileSync(file,'utf8').includes("components/feature-surface")||fs.readFileSync(file,'utf8').includes("../components/feature-surface"));
const nodeModules=fs.existsSync(path.join(root,'node_modules'));
const report={version:'V228.0.0',generatedAt:new Date().toISOString(),pages:pages.length,tinyPages:tiny.length,registryRoutes:registryRoutes.length,unresolvedTinyPages:unresolved,nodeModulesPresent:nodeModules,buildStatus:nodeModules?'READY_TO_RUN':'BLOCKED_NODE_MODULES_MISSING',domainSurfaceComponents:domainFiles.filter(fs.existsSync).length,genericSurfacePages:genericSurfacePages.length,statusProtocol:fs.existsSync(path.join(root,'modules/platform/surface-status.ts'))&&fs.existsSync(path.join(root,'middleware.ts'))?'EXPLICIT':'MISSING'};
console.log(JSON.stringify(report,null,2));
if(unresolved.length) process.exitCode=1;
