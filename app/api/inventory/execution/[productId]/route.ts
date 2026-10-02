import { NextResponse } from 'next/server';
import { getInventoryExecutionTruth } from '../../../../../modules/commerce/inventory/execution-truth';

export async function GET(req:Request,{params}:{params:{productId:string}}){
  try{
    const offerId=new URL(req.url).searchParams.get('offerId')||undefined;
    const truth=await getInventoryExecutionTruth(params.productId,offerId);
    if(!truth)return NextResponse.json({ok:false,error:'INVENTORY_TRUTH_NOT_FOUND'},{status:404,headers:{'Cache-Control':'no-store'}});
    return NextResponse.json({ok:true,feature:'inventory-execution-truth',surfaceStatus:'LIVE',truth},{headers:{'Cache-Control':'no-store'}});
  }catch(e){
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:'INVENTORY_TRUTH_ERROR'},{status:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400,headers:{'Cache-Control':'no-store'}});
  }
}
