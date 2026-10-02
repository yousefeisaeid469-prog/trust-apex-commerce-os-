import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { cartSummary } from '../../../../modules/commerce/cart/store';
import { createQuote } from '../../../../modules/commerce/core/engine';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){ const user=await getCurrentUser(req); if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401}); try{const body=await req.json().catch(()=>({})); const summary=await cartSummary(user.id); if(summary.cart.items.length===0)return NextResponse.json({ok:false,error:'CART_EMPTY'},{status:400}); const quote=await createQuote(summary.cart.items,10*60_000,typeof body?.discountCode==='string'?body.discountCode:undefined, typeof body?.destinationRegion==='string'?body.destinationRegion:'GLOBAL', user.id); return NextResponse.json({ok:true,checkout:quote},{headers:{'Cache-Control':'no-store'}});}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'CHECKOUT_ERROR'},{status:400});}}
