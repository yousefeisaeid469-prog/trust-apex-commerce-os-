import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../modules/platform/db/postgres';
import { getCurrentUser, AuthRequiredError } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  try{const user=await getCurrentUser(req);if(!user)throw new AuthRequiredError();const orderId=req.nextUrl.searchParams.get('orderId');
    const rows=await query(orderId ? 'select id,order_id,provider,payment_intent_id,amount,currency,status,created_at,updated_at from trust_payments where order_id=$2 and order_id in (select id from trust_orders where customer_id=$1) order by created_at desc limit 25' : 'select id,order_id,provider,payment_intent_id,amount,currency,status,created_at,updated_at from trust_payments where order_id in (select id from trust_orders where customer_id=$1) order by created_at desc limit 25', orderId ? [user.id,orderId] : [user.id]);return NextResponse.json({ok:true,payments:rows.rows},{headers:{'Cache-Control':'no-store'}})}
  catch(e){const status=e instanceof AuthRequiredError?401:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400;return NextResponse.json({ok:false,error:e instanceof Error?e.message:'PAYMENT_STATUS_ERROR'},{status})}
}
