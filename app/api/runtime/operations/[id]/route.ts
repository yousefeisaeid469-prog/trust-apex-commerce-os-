import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { runtimeOperationSnapshot } from '../../../../../modules/platform/runtime-spine';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const id=(await params).id; const operation=await runtimeOperationSnapshot(id);
  if(!operation)return NextResponse.json({ok:false,error:'RUNTIME_OPERATION_NOT_FOUND'},{status:404});
  return NextResponse.json({ok:true,operation},{headers:{'Cache-Control':'no-store'}});
}
