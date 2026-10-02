import { NextRequest, NextResponse } from 'next/server';
import { requestRefund } from '../../../../modules/commerce/payments/orchestrator';
import { withPgTransaction } from '../../../../modules/platform/db/postgres';
import { requirePermission, AuthRequiredError } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  try{ const user=await requirePermission(req,'orders:operate'); const key=req.headers.get('idempotency-key')?.trim(); if(!key) return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400}); const b=await req.json();
    const result=await withPgTransaction(client=>requestRefund({transaction:async work=>work(client),query:(sql,params)=>client.query(sql,params)},{paymentId:String(b.paymentId),amount:Number(b.amount),reason:typeof b.reason==='string'?b.reason:undefined,idempotencyKey:key})); return NextResponse.json({ok:true,refund:result},{headers:{'Cache-Control':'no-store'}});
  }catch(e){ const status=e instanceof AuthRequiredError?401:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400; return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REFUND_ERROR'},{status}); }
}
