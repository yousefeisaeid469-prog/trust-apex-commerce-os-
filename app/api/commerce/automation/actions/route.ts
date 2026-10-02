import { NextResponse } from 'next/server';
import { requireOwnerSession } from '../../../../../modules/platform/security/owner-auth';
import { approveAutomationPlan,executeAutomationPlan } from '../../../../../modules/platform/global-commerce-automation/core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(request:Request){
  let owner; try{owner=await requireOwnerSession(request)}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'OWNER_AUTH_REQUIRED'},{status:401})}
  try{const body=await request.json(); const op=String(body?.operation||''); if(op==='APPROVE') return NextResponse.json({ok:true,result:await approveAutomationPlan({planId:String(body.planId||''),actorEmail:owner.email,reason:String(body.reason||'')})}); if(op==='EXECUTE') return NextResponse.json({ok:true,result:await executeAutomationPlan({planId:String(body.planId||''),actorEmail:owner.email,reason:String(body.reason||''),requestId:request.headers.get('x-request-id')||undefined})}); throw new Error('UNKNOWN_AUTOMATION_OPERATION')}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'AUTOMATION_ACTION_FAILED'},{status:400})}
}
