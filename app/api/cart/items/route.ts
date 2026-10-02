import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser,AuthRequiredError} from '../../../../modules/platform/auth/current-user';
import {addToCart,updateCartLine,cartSummary} from '../../../../modules/commerce/cart/store';
export const dynamic='force-dynamic'; export const runtime='nodejs';
function out(e:unknown){const status=e instanceof AuthRequiredError?401:400;return NextResponse.json({ok:false,error:e instanceof Error?e.message:'INVALID_CART'},{status})}
export async function POST(req:NextRequest){try{const u=await getCurrentUser(req);if(!u)throw new AuthRequiredError();const b=await req.json();const cart=await addToCart(u.id,String(b?.productId??''),Number(b?.qty??1),typeof b?.offerId==='string'?b.offerId:undefined);return NextResponse.json({ok:true,cart,summary:await cartSummary(u.id)},{status:201,headers:{'Cache-Control':'no-store'}})}catch(e){return out(e)}}
export async function PATCH(req:NextRequest){try{const u=await getCurrentUser(req);if(!u)throw new AuthRequiredError();const b=await req.json();const cart=await updateCartLine(u.id,String(b?.productId??''),Number(b?.qty),typeof b?.offerId==='string'?b.offerId:undefined);return NextResponse.json({ok:true,cart,summary:await cartSummary(u.id)},{headers:{'Cache-Control':'no-store'}})}catch(e){return out(e)}}
