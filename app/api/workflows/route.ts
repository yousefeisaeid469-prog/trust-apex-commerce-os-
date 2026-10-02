import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { submitCommand } from '../../../modules/platform/command-bus';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const key=req.headers.get('idempotency-key')?.trim();
  if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{
    const b=await req.json();
    if(typeof b?.workflowType!=='string'||typeof b?.aggregateType!=='string'||typeof b?.aggregateId!=='string')throw new Error('WORKFLOW_IDENTITY_REQUIRED');
    const result=await submitCommand({commandType:'workflow.start',aggregateType:b.aggregateType,aggregateId:b.aggregateId,idempotencyKey:key,
      payload:{workflowType:b.workflowType,aggregateType:b.aggregateType,aggregateId:b.aggregateId,input:b.input&&typeof b.input==='object'?b.input:{},commandPayload:b.commandPayload,action:b.action,tenantId:b.tenantId},
      actorId:String(user.id),correlationId:req.headers.get('x-correlation-id')??undefined});
    return NextResponse.json({ok:true,workflowCommand:result},{status:result.replay?200:202,headers:{'Cache-Control':'no-store'}});
  }catch(e){const code=e instanceof Error?e.message:'WORKFLOW_SUBMISSION_FAILED';return NextResponse.json({ok:false,error:code},{status:400,headers:{'Cache-Control':'no-store'}})}
}
