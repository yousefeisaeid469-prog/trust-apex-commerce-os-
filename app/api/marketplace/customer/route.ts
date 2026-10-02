import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getLoyaltyAccount,listPriceAlerts,listWishlist } from '../../../../modules/marketplace/customer-retention';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});const [wishlist,alerts,loyalty]=await Promise.all([listWishlist(u.id),listPriceAlerts(u.id),getLoyaltyAccount(u.id)]);return NextResponse.json({ok:true,wishlist,priceAlerts:alerts,loyalty},{headers:{'Cache-Control':'no-store'}})}
