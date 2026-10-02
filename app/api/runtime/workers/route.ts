import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { workerPlaneSnapshot } from '../../../../modules/platform/worker-plane';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const limit=Number(req.nextUrl.searchParams.get('limit')||100);
  return NextResponse.json({ok:true,workers:await workerPlaneSnapshot(limit)},{headers:{'Cache-Control':'no-store'}});
}
