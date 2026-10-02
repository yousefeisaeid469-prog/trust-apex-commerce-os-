import { NextResponse } from 'next/server';
import { executeMarketplaceRun } from '../../../../../modules/platform/v316/marketplace/runtime.ts';
export async function POST(req:Request){
  try{const body=await req.json();const result=await executeMarketplaceRun({tenantId:String(body.tenantId??''),sellerId:String(body.sellerId??''),productId:String(body.productId??''),offerId:String(body.offerId??''),customerId:String(body.customerId??''),quantity:Number(body.quantity),unitPriceMinor:BigInt(String(body.unitPriceMinor??'0')),shippingMinor:BigInt(String(body.shippingMinor??'0')),currency:String(body.currency??'').toUpperCase(),commissionBps:Number(body.commissionBps??0),idempotencyKey:String(body.idempotencyKey??'')});return NextResponse.json({ok:true,workflow:result});}
  catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'MARKETPLACE_RUN_FAILED'},{status:400});}
}
