import {NextRequest,NextResponse} from 'next/server';
import {query,withPgTransaction} from '../../../../modules/platform/db/postgres';
import {getCurrentUser} from '../../../../modules/platform/security/route-auth';
import {getMerchantByUserId} from '../../../../modules/merchants/core/store';
import {requestPayoutTx,reconcileSellerBalancesTx,calculatePayoutEligibilityTx} from '../../../../modules/marketplace/financial-loop';
import {requestSellerOrderPayoutTx} from '../../../../modules/marketplace/seller-operations';

export const dynamic='force-dynamic';

export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  const [balance,payouts]=await Promise.all([
    query(`select merchant_id,pending_balance,available_balance,held_balance,currency,updated_at from trust_marketplace_seller_balances where merchant_id=$1`,[merchant.id]),
    query(`select id,amount,currency,status,provider,provider_reference,requested_at,processed_at,failure_code from trust_marketplace_payout_requests where merchant_id=$1 order by requested_at desc limit 50`,[merchant.id]),
  ]);
  const eligibility=await withPgTransaction(tx=>calculatePayoutEligibilityTx(tx,{merchantId:merchant.id,idempotencyKey:`eligibility:finance-get:${merchant.id}:${Date.now()}`}));
  return NextResponse.json({ok:true,merchantId:merchant.id,balance:balance.rows[0]??{pending_balance:0,available_balance:0,held_balance:0,currency:'EGP'},eligibility,payouts:payouts.rows,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{
    const b=await req.json();
    if(b.action==='request_payout'){
      const result=await withPgTransaction(tx=>b.sellerOrderId
        ? requestSellerOrderPayoutTx(tx,{merchantId:merchant.id,sellerOrderId:String(b.sellerOrderId),amount:Number(b.amount),currency:b.currency,provider:b.provider,idempotencyKey:key})
        : requestPayoutTx(tx,{merchantId:merchant.id,amount:Number(b.amount),currency:b.currency,provider:b.provider,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});
    }
    if(b.action==='reconcile'){
      const result=await withPgTransaction(tx=>reconcileSellerBalancesTx(tx,{merchantId:merchant.id,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'});
    }
    return NextResponse.json({ok:false,error:'UNKNOWN_FINANCE_ACTION'},{status:400});
  }catch(e){const m=e instanceof Error?e.message:'FINANCE_OPERATION_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m.startsWith('INVALID_')||m.endsWith('_REQUIRED')?400:409});}
}
