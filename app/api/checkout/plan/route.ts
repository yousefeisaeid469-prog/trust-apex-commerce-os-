import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { planMarketplaceCheckout } from '../../../../modules/marketplace/checkout-planner';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(req: NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{
    const body=await req.json().catch(()=>({}));
    const items=Array.isArray(body?.items)?body.items.map((x:any)=>({productId:String(x?.productId??''),qty:Number(x?.qty??x?.quantity),offerId:typeof x?.offerId==='string'?x.offerId:undefined})):[];
    const destinationRegion=typeof body?.destinationRegion==='string'?body.destinationRegion:'GLOBAL';
    const plan=await planMarketplaceCheckout(items,destinationRegion);
    return NextResponse.json({ok:true,plan},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'CHECKOUT_PLAN_FAILED'},{status:400,headers:{'Cache-Control':'no-store'}})}
}
