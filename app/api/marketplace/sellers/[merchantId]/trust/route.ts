import { NextResponse } from 'next/server';
import { getSellerTrust } from '../../../../../../modules/marketplace/seller-intelligence';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(_req:Request,{params}:{params:Promise<{merchantId:string}>}){
  try{
    const {merchantId}=await params;
    if(!merchantId?.trim())return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:400});
    const trust=await getSellerTrust(merchantId.trim());
    return NextResponse.json({ok:true,trust},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:'SELLER_TRUST_FAILED'},{status:500});
  }
}
