import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { listCustomerSellerOrders } from '../../../../../modules/marketplace/seller-orders';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:{id:string}}){
 const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 try{return NextResponse.json({ok:true,sellerOrders:await listCustomerSellerOrders(params.id,u.id)},{headers:{'Cache-Control':'no-store'}})}catch(e:any){return NextResponse.json({ok:false,error:e?.message??'SELLER_ORDERS_FAILED'},{status:400});}
}
