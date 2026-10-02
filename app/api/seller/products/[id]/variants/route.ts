import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../../modules/merchants/core/store';
import { createVariant } from '../../../../../../modules/platform/product-core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:{id:string}}){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});try{const m=await getMerchantByUserId(u.id);if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});const b=await req.json();const variant=await createVariant(m.id,params.id,b);return NextResponse.json({ok:true,variant},{status:201})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'VARIANT_FAILED'},{status:400})}}
