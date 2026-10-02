import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const api=path.join(root,'app/api'); const routes=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory())walk(p); else if(e.name==='route.ts'){const source=fs.readFileSync(p,'utf8'); const rel=path.relative(api,p).replace(/\\/g,'/').replace(/\/route\.ts$/,''); const methods=[...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g)].map(m=>m[1]); routes.push({route:'/api/'+rel,methods,source});}}}
walk(api);
const sensitive=/\/admin(?!\/session)|\/autopilot|\/revenue|\/payment|\/refund|\/merchant|\/seller|\/campaign|\/sourcing|\/negotiation|\/control|\/internal/i;
const publicExceptions=new Set(['/api/merchant-supergraph','/api/merchants']);
const unguarded=routes.filter(r=>sensitive.test(r.route)&&!publicExceptions.has(r.route)&&!/requireAdminSession|requireAdmin\(|requirePermission|requireUser|getCurrentUser|verifyAdminSession|trust_session|verifyWebhook|webhookSignature/i.test(r.source));
console.log(`TRUST V222 endpoint auth matrix — ${routes.length} routes scanned`);
if(unguarded.length){console.error(`FAIL — ${unguarded.length} sensitive route(s) have no detected auth guard`); for(const r of unguarded) console.error(`- ${r.route} [${r.methods.join(',')}]`); process.exit(1);}
const publicRoutes=routes.filter(r=>!sensitive.test(r.route)&&!/requireAdminSession|requireAdmin\(|requirePermission|requireUser|getCurrentUser|verifyAdminSession|trust_session|verifyWebhook|webhookSignature/i.test(r.source));
console.log(`PASS — ${publicRoutes.length} route(s) intentionally classified as public by static heuristic.`);
