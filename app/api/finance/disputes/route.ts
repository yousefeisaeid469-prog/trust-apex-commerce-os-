import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {withPgTransaction} from '../../../../modules/platform/db/postgres';
import {openDisputeTx,resolveDisputeTx} from '../../../../modules/marketplace/disputes-finance';

const allowed=(role:string)=>['admin','operations'].includes(role);
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!allowed(u.role))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{
    const b=await req.json();
    if(b.action==='open'){
      const result=await withPgTransaction(tx=>openDisputeTx(tx,{paymentId:String(b.paymentId||''),orderId:typeof b.orderId==='string'?b.orderId:undefined,amount:Number(b.amount),kind:b.kind,reasonCode:b.reasonCode,provider:b.provider,providerCaseId:b.providerCaseId,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});
    }
    if(b.action==='resolve'){
      const result=await withPgTransaction(tx=>resolveDisputeTx(tx,{disputeId:String(b.disputeId||''),status:b.status,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'});
    }
    return NextResponse.json({ok:false,error:'UNKNOWN_DISPUTE_ACTION'},{status:400});
  }catch(e){const m=e instanceof Error?e.message:'DISPUTE_OPERATION_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m.startsWith('INVALID_')||m.endsWith('_REQUIRED')?400:409});}
}
