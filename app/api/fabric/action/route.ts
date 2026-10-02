import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '../../../../modules/platform/auth/current-user';
import { appendAuditEvent } from '../../../../modules/platform/audit/ledger';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){
  try{
    const actor=await requirePermission(req,'trust:action'); const a=await req.json(); const high=a?.risk==='high'||a?.risk==='HIGH'||a?.risk==='critical'||a?.risk==='CRITICAL';
    const allowed=!high&&a?.reversible===true&&Number(a?.confidence??0)>=0.75;
    const audit=await appendAuditEvent({actorId:actor.id,action:allowed?'fabric.action.allowed':'fabric.action.blocked',resourceType:'fabric_action',resourceId:typeof a?.actionId==='string'?a.actionId:undefined,payload:{allowed,risk:a?.risk??null,reversible:a?.reversible??null,confidence:Number(a?.confidence??0)}});
    return NextResponse.json({allowed,approvalRequired:!allowed,audit:{persisted:true,chainHash:audit.chainHash}},{headers:{'Cache-Control':'no-store'}});
  }catch(e){const code=e instanceof Error?e.message:'FABRIC_ACTION_ERROR';return NextResponse.json({ok:false,error:code,persisted:false},{status:code==='Authentication required'?401:code.includes('permission')?403:code==='DATABASE_NOT_CONFIGURED'?503:400});}
}
