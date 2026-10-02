import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../../modules/platform/auth/current-user';
import {query,withPgTransaction} from '../../../../../modules/platform/db/postgres';
import {transitionDurableOrder,type DurableOrderStatus} from '../../../../../modules/commerce/orders/state';
export const dynamic='force-dynamic'; export const runtime='nodejs';
const allowed=new Set<DurableOrderStatus>(['pending','confirmed','processing','shipped','delivered','cancelled','refunded']);
export async function PATCH(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['merchant','admin','operations','support'].includes(u.role))return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
  try{
    const b=await req.json(); const orderId=typeof b?.orderId==='string'?b.orderId:''; const toValue=typeof b?.status==='string'?b.status:'';
    if(!orderId||!allowed.has(toValue as DurableOrderStatus)) return NextResponse.json({ok:false,error:'INVALID_ORDER_STATUS'},{status:400});
    const to=toValue as DurableOrderStatus;
    if(u.role==='merchant'){
      const ownership=(await query(`select 1 from trust_order_items oi join trust_products p on p.id=oi.product_id join trust_merchant_profiles mp on mp.id=p.merchant_id where oi.order_id=$1 and mp.user_id=$2 limit 1`,[orderId,u.id])).rows[0];
      if(!ownership)return NextResponse.json({ok:false,error:'ORDER_NOT_OWNED'},{status:403});
    }
    const result=await withPgTransaction(client=>transitionDurableOrder(client,{orderId,to,actorId:u.id,source:u.role==='merchant'?'merchant':'operations',note:typeof b.note==='string'?b.note.slice(0,500):undefined}));
    return NextResponse.json({ok:true,order:result,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
  }catch(e){const msg=e instanceof Error?e.message:'ORDER_STATUS_UPDATE_FAILED';const status=msg==='ORDER_NOT_FOUND'?404:msg.startsWith('INVALID_ORDER_TRANSITION')?409:msg==='DATABASE_NOT_CONFIGURED'?503:400;return NextResponse.json({ok:false,error:msg},{status});}
}
