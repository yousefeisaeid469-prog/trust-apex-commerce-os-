import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../../modules/platform/auth/current-user';
import { query } from '../../../../../../modules/platform/db/postgres';
import { getOrderTracking } from '../../../../../../modules/commerce/order-tracking';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:{id:string}}){
  const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{
    const order=(await query(`select customer_id from trust_orders where id=$1`,[params.id])).rows[0];
    if(!order)return NextResponse.json({ok:false,error:'ORDER_NOT_FOUND'},{status:404});
    if(order.customer_id!==user.id&&!['admin','support','operations'].includes(user.role))return NextResponse.json({ok:false,error:'ORDER_ACCESS_DENIED'},{status:403});
    return NextResponse.json({ok:true,...await getOrderTracking(params.id)},{headers:{'Cache-Control':'no-store'}});
  }catch(e){const m=e instanceof Error?e.message:'ORDER_TRACKING_ERROR';return NextResponse.json({ok:false,error:m},{status:m==='DATABASE_NOT_CONFIGURED'?503:400});}
}
