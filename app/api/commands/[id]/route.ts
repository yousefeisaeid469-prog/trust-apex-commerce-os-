import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { commandSnapshot } from '../../../../modules/platform/command-bus';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const id=(await params).id; const command=await commandSnapshot(id); if(!command)return NextResponse.json({ok:false,error:'COMMAND_NOT_FOUND'},{status:404});
  if(!['admin','operations'].includes(String(user.role)) && command.actorId && String(command.actorId)!==String(user.id))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  return NextResponse.json({ok:true,command},{headers:{'Cache-Control':'no-store'}});
}
