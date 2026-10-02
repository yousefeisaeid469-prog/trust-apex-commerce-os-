import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {query} from '../../../../modules/platform/db/postgres';
import {normalizeOrderList} from '../../../../modules/platform/order-experience';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try { const rows=(await query(`select id,status,subtotal,shipping,total,currency,payment_method,created_at from trust_orders where customer_id=$1 order by created_at desc limit 50`,[u.id])).rows; return NextResponse.json({ok:true,orders:normalizeOrderList(rows)},{headers:{'Cache-Control':'no-store'}}); }
  catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'ORDERS_ERROR'},{status:400});}
}
