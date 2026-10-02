import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceProduct } from '../../../../../modules/marketplace/discovery';
import { listProductReviews } from '../../../../../modules/marketplace/customer-retention';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(_req:NextRequest,{params}:{params:{id:string}}){
  try { const result=await getMarketplaceProduct(params.id); if(!result)return NextResponse.json({ok:false,error:'PRODUCT_NOT_FOUND'},{status:404}); return NextResponse.json({ok:true,...result,reviews:await listProductReviews(params.id)},{headers:{'Cache-Control':'no-store'}}); }
  catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'PRODUCT_LOOKUP_FAILED'},{status:400});}
}
