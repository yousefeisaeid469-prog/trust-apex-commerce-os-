import { NextResponse } from 'next/server';
import { createAdCampaign, createSellerPlan, getGrowthSnapshot, recordAdClick, recordMarketplaceFee } from '@/modules/platform/marketplace-growth';

export async function GET(req:Request){
  const merchantId=new URL(req.url).searchParams.get('merchantId');
  if(!merchantId)return NextResponse.json({error:'MERCHANT_REQUIRED'},{status:400});
  try{return NextResponse.json({ok:true,snapshot:await getGrowthSnapshot(merchantId)});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GROWTH_READ_FAILED'},{status:500});}
}
export async function POST(req:Request){
  try{
    const body=await req.json(); const action=String(body.action??'');
    if(action==='SET_SELLER_PLAN') return NextResponse.json({ok:true,plan:await createSellerPlan({merchantId:String(body.merchantId),planCode:String(body.planCode)})});
    if(action==='CREATE_AD_CAMPAIGN') return NextResponse.json({ok:true,campaign:await createAdCampaign({merchantId:String(body.merchantId),type:body.type,name:String(body.name),dailyBudget:Number(body.dailyBudget),bidAmount:Number(body.bidAmount),targeting:body.targeting})},{status:201});
    if(action==='RECORD_AD_CLICK') return NextResponse.json({ok:true,click:await recordAdClick({campaignId:String(body.campaignId),bidAmount:Number(body.bidAmount),idempotencyKey:String(body.idempotencyKey),orderId:body.orderId?String(body.orderId):undefined})},{status:201});
    if(action==='RECORD_MARKETPLACE_FEE') return NextResponse.json({ok:true,fee:await recordMarketplaceFee({merchantId:String(body.merchantId),orderId:body.orderId?String(body.orderId):undefined,feeType:String(body.feeType??'REFERRAL'),programCode:String(body.programCode??'STARTER'),baseAmount:Number(body.baseAmount),rateBps:Number(body.rateBps),idempotencyKey:String(body.idempotencyKey)})},{status:201});
    return NextResponse.json({error:'UNKNOWN_ACTION'},{status:400});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GROWTH_WRITE_FAILED'},{status:400});}
}
