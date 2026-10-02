import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../../modules/platform/security/route-auth';
import {getMerchantByUserId} from '../../../../../modules/merchants/core/store';
import {query,withPgTransaction} from '../../../../../modules/platform/db/postgres';
import {generateSellerStatementTx} from '../../../../../modules/marketplace/disputes-finance';

export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  const rows=await query(`select id,period_start,period_end,opening_balance,credits,debits,closing_balance,currency,generated_at from trust_marketplace_seller_statements where merchant_id=$1 order by period_end desc limit $2`,[merchant.id,Math.min(100,Math.max(1,Number(req.nextUrl.searchParams.get('limit')||25)))]);
  return NextResponse.json({ok:true,merchantId:merchant.id,statements:rows.rows,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant=await getMerchantByUserId(u.id); if(!merchant)return NextResponse.json({ok:false,error:'MERCHANT_NOT_FOUND'},{status:404});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{const b=await req.json();const result=await withPgTransaction(tx=>generateSellerStatementTx(tx,{merchantId:merchant.id,periodStart:String(b.periodStart||''),periodEnd:String(b.periodEnd||''),currency:typeof b.currency==='string'?b.currency:undefined,idempotencyKey:key}));return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});}
  catch(e){const m=e instanceof Error?e.message:'SELLER_STATEMENT_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m.startsWith('INVALID_')||m.endsWith('_REQUIRED')?400:409});}
}
