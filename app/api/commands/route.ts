import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { submitCommand } from '../../../modules/platform/command-bus';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403,headers:{'Cache-Control':'no-store'}});
  const key=req.headers.get('idempotency-key')?.trim();
  if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400,headers:{'Cache-Control':'no-store'}});
  try{
    const b=await req.json();
    if(typeof b?.commandType!=='string'||typeof b?.aggregateType!=='string'||typeof b?.aggregateId!=='string')throw new Error('COMMAND_IDENTITY_REQUIRED');
    const result=await submitCommand({tenantId:typeof b.tenantId==='string'?b.tenantId:'default',commandType:b.commandType,aggregateType:b.aggregateType,aggregateId:b.aggregateId,idempotencyKey:key,payload:b.payload&&typeof b.payload==='object'?b.payload:{},actorId:String(user.id),correlationId:req.headers.get('x-correlation-id')??undefined});
    return NextResponse.json({ok:true,command:result},{status:result.replay?200:202,headers:{'Cache-Control':'no-store'}});
  }catch(e){const code=e instanceof Error?e.message:'COMMAND_SUBMISSION_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='COMMAND_IDEMPOTENCY_CONFLICT'?409:400,headers:{'Cache-Control':'no-store'}})}
}
