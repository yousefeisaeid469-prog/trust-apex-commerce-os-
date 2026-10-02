import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { productionExecutionSnapshot } from '../../../../modules/platform/runtime-spine';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role)))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const orderId=req.nextUrl.searchParams.get('orderId')||undefined;
  const health=req.nextUrl.searchParams.get('health')||undefined;
  const limit=Number(req.nextUrl.searchParams.get('limit')||50);
  const snapshot=await productionExecutionSnapshot({orderId,health,limit});
  return NextResponse.json({ok:true,snapshot},{headers:{'Cache-Control':'no-store'}});
}
