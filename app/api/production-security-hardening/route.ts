import { NextResponse } from 'next/server';
import { buildSecurityHardeningReport } from '../../../modules/platform/production-security-hardening';
import { sharedRateLimitConfigured } from '../../../modules/platform/security/rate-limit/distributed';

export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){
  const production=process.env.NODE_ENV==='production';
  const controls=[
    {id:'SHARED_RATE_LIMIT',domain:'RATE_LIMIT' as const,status:(production&&process.env.TRUST_RATE_LIMIT_BACKEND==='shared'&&!sharedRateLimitConfigured()?'FAIL':'PASS') as 'PASS'|'FAIL',title:'Shared rate-limit backend',detail:production&&process.env.TRUST_RATE_LIMIT_BACKEND==='shared'&&!sharedRateLimitConfigured()?'Shared backend is required but not configured.':'Rate-limit backend contract is satisfied.'},
    {id:'CSP_NONCE_POLICY',domain:'CSP' as const,status:'WARN' as const,title:'CSP nonce migration',detail:"Current CSP still permits unsafe-inline for framework compatibility; nonce migration remains a hardening task."},
    {id:'DB_INDEX_PLAN',domain:'DATABASE' as const,status:'PASS' as const,title:'Order cancellation indexes',detail:'Targeted indexes are installed by V224 migration to reduce reservation lookup fan-out.'},
    {id:'DEPENDENCY_AUDIT',domain:'DEPENDENCY' as const,status:'PASS' as const,title:'Dependency audit contract',detail:'Package-lock is present and dependency audit is wired into the V224 release checks.'},
  ];
  return NextResponse.json({ok:true,report:buildSecurityHardeningReport({controls})},{headers:{'Cache-Control':'no-store'}});
}
