import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { workflowSnapshot } from '../../../../modules/platform/workflow-orchestrator';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const workflow=await workflowSnapshot((await params).id);
  if(!workflow)return NextResponse.json({ok:false,error:'WORKFLOW_NOT_FOUND'},{status:404});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  return NextResponse.json({ok:true,workflow},{headers:{'Cache-Control':'no-store'}});
}
