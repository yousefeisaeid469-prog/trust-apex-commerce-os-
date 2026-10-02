import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { createSellerStore } from '../../../../modules/platform/product-core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});try{const b=await req.json();const merchant=await createSellerStore(u.id,b);return NextResponse.json({ok:true,merchant},{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'STORE_FAILED'},{status:400})}}
