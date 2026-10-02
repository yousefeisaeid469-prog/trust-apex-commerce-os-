import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getLoyaltyAccount } from '../../../../modules/marketplace/customer-retention';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});return NextResponse.json({ok:true,account:await getLoyaltyAccount(u.id)},{headers:{'Cache-Control':'no-store'}})}
