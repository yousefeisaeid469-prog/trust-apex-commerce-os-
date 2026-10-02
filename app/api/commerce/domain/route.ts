import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { commerceDomainSnapshot } from '../../../../modules/commerce/core/commerce-domain-kernel';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const orderId=req.nextUrl.searchParams.get('orderId')?.trim()||undefined;
  const customerId=user.role==='admin'||user.role==='operations'
    ? (req.nextUrl.searchParams.get('customerId')?.trim()||undefined)
    : user.id;
  if(user.role!=='admin'&&user.role!=='operations'&&orderId){
    const snapshot=await commerceDomainSnapshot({orderId});
    if(snapshot.rows[0]?.customer_id!==user.id) return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  }
  const snapshot=await commerceDomainSnapshot({customerId,orderId});
  return NextResponse.json({ok:true,commerce:snapshot},{headers:{'Cache-Control':'no-store'}});
}
