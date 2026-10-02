import type { AuthRouteAudit, AuthSurface, ProductionSecurityScaleReport, ScaleControl } from './contracts';

function inferSurface(routeText:string): {surface:AuthSurface; evidence:string} {
  if (/webhook/i.test(routeText)) return {surface:'WEBHOOK', evidence:'webhook route pattern'};
  if (/requireAdminSession|requireAdmin\(|verifyAdminSession/.test(routeText)) return {surface:'ADMIN', evidence:'admin session guard'};
  if (/requirePermission/.test(routeText)) return {surface:'PERMISSION', evidence:'permission guard'};
  if (/requireUser|getCurrentUser|trust_session/.test(routeText)) return {surface:'USER', evidence:'user session guard'};
  if (/getMerchant|merchantId|seller/i.test(routeText)) return {surface:'MERCHANT', evidence:'merchant/seller surface without detected auth guard'};
  return {surface:'PUBLIC', evidence:'no auth guard detected'};
}

export function auditRouteAuth(routes:{route:string; methods:string[]; source:string}[]): AuthRouteAudit[] {
  return routes.map(r=>{
    const inferred=inferSurface(r.source);
    const sensitive=/\/admin|\/agent|\/autopilot|\/revenue|\/financial|\/payment|\/refund|\/merchant|\/seller|\/campaign|\/sourcing|\/negotiation|\/control|\/internal/i.test(r.route);
    if (sensitive && inferred.surface==='UNKNOWN') return {route:r.route,methods:r.methods,surface:'UNKNOWN',status:'FAIL',evidence:'sensitive route has no detected authentication/authorization guard'};
    const status:AuthRouteAudit['status'] = sensitive && (inferred.surface==='PUBLIC' || inferred.surface==='MERCHANT') ? 'FAIL' : inferred.surface==='UNKNOWN' ? 'WARN' : 'PASS';
    return {route:r.route,methods:r.methods,surface:inferred.surface,status,evidence:inferred.evidence};
  });
}

export function buildSecurityScaleReport(input:{routes?:{route:string;methods:string[];source:string}[];controls?:ScaleControl[];now?:string}={}):ProductionSecurityScaleReport {
  const auth=auditRouteAuth(input.routes??[]);
  const controls=input.controls??[];
  const checks=[...auth.map(a=>({status:a.status,detail:`${a.route}: ${a.evidence}`})),...controls.map(c=>({status:c.status,detail:c.detail}))];
  const blockers=checks.filter(c=>c.status==='FAIL').map(c=>c.detail);
  const warnings=checks.filter(c=>c.status==='WARN').map(c=>c.detail);
  const score=checks.length?Math.round(checks.reduce((n,c)=>n+(c.status==='PASS'?100:c.status==='WARN'?60:0),0)/checks.length):0;
  return {version:'V222.0.0',generatedAt:input.now??new Date().toISOString(),ready:blockers.length===0,score,auth,controls,blockers,warnings};
}
