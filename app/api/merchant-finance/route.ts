import { NextResponse } from 'next/server';
import { requireUser } from '../../../modules/platform/auth/current-user';
import { merchantFinanceSnapshot, requestMerchantPayout } from '../../../modules/platform/v319';
export const dynamic='force-dynamic';
export async function GET(req:Request){
  try{const user=await requireUser(req as any); const merchantId=String(user.merchantId||''); if(!merchantId)throw new Error('MERCHANT_ACCOUNT_REQUIRED'); return NextResponse.json({ok:true,surfaceStatus:'LIVE',...(await merchantFinanceSnapshot(merchantId))});}
  catch(e){const code=e instanceof Error?e.message:'MERCHANT_FINANCE_QUERY_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:401});}
}
export async function POST(req:Request){
  try{const user=await requireUser(req as any); const merchantId=String(user.merchantId||''); if(!merchantId)throw new Error('MERCHANT_ACCOUNT_REQUIRED'); const b=await req.json(); if(b?.action!=='payout')throw new Error('SUPPORTED_ACTION_IS_PAYOUT'); const result=await requestMerchantPayout({merchantId,amount:Number(b.amount),currency:String(b.currency||'EGP'),idempotencyKey:String(b.idempotencyKey||''),reference:b.reference}); return NextResponse.json({ok:true,surfaceStatus:'LIVE',payout:result},{status:201});}
  catch(e){const code=e instanceof Error?e.message:'MERCHANT_FINANCE_OPERATION_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:400});}
}
