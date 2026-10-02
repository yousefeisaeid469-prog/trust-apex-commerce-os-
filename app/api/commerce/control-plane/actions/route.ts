import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireOwnerSession } from '../../../../../modules/platform/security/owner-auth';
import { executeControlCommand, commandById } from '../../../../../modules/platform/global-commerce-control-plane/core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(request:Request){
  let owner; try{owner=await requireOwnerSession(request);}catch(error){const code=error instanceof Error?error.message:'OWNER_AUTH_REQUIRED';return NextResponse.json({ok:false,error:code},{status:code==='OWNER_ACCESS_NOT_CONFIGURED'?503:401});}
  const body=await request.json().catch(()=>({})); const commandId=String(body?.commandId||'') as any; const command=commandById(commandId);
  if(!command) return NextResponse.json({ok:false,error:'UNKNOWN_CONTROL_COMMAND'},{status:400});
  if(command.requiresApproval && body?.approval!=='APPROVED') return NextResponse.json({ok:false,error:'APPROVAL_REQUIRED',command},{status:202});
  try{const result=await executeControlCommand({commandId,orderId:typeof body?.orderId==='string'?body.orderId:undefined,reason:typeof body?.reason==='string'?body.reason:undefined,actorEmail:owner.email,requestId:request.headers.get('x-request-id')||randomUUID()});return NextResponse.json({ok:true,...result},{status:result.status==='UNVERIFIED'?409:200,headers:{'cache-control':'no-store'}})}
  catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'CONTROL_COMMAND_FAILED'},{status:400,headers:{'cache-control':'no-store'}})}
}
