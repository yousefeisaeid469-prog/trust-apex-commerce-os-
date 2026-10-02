import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { runtimeSpineSnapshot } from '../../../modules/platform/runtime-spine';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const tenant=req.nextUrl.searchParams.get('tenantId')||'default';
  return NextResponse.json({ok:true,runtime:await runtimeSpineSnapshot(tenant)},{headers:{'Cache-Control':'no-store'}});
}
