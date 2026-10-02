import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { addWishlist,removeWishlist,listWishlist } from '../../../../modules/marketplace/customer-retention';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});return NextResponse.json({ok:true,items:await listWishlist(u.id)},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});try{const b=await req.json();return NextResponse.json({ok:true,item:await addWishlist(u.id,String(b?.productId??''))},{status:201});}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'WISHLIST_FAILED'},{status:400})}}
export async function DELETE(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});const id=req.nextUrl.searchParams.get('productId');if(!id)return NextResponse.json({ok:false,error:'PRODUCT_REQUIRED'},{status:400});return NextResponse.json({ok:true,...await removeWishlist(u.id,id)})}
