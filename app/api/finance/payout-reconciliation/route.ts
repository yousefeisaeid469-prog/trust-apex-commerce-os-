import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {withPgTransaction} from '../../../../modules/platform/db/postgres';
import {advancePayoutReconciliationTx,reconcilePayoutTx,resolvePayoutReconciliationTx} from '../../../../modules/marketplace/disputes-finance';

const allowed=(role:string)=>['admin','operations'].includes(role);
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!allowed(u.role))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{
    const b=await req.json();
    if(b.action==='reconcile'){
      const result=await withPgTransaction(tx=>reconcilePayoutTx(tx,{payoutId:String(b.payoutId||''),provider:String(b.provider||''),providerReference:String(b.providerReference||''),settledAmount:Number(b.settledAmount),providerEventId:typeof b.providerEventId==='string'?b.providerEventId:undefined,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});
    }
    if(b.action==='advance'){
      const result=await withPgTransaction(tx=>advancePayoutReconciliationTx(tx,{reconciliationId:String(b.reconciliationId||''),workflowStatus:b.workflowStatus,actorId:u.id,evidence:b.evidence,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'});
    }
    if(b.action==='resolve'){
      const result=await withPgTransaction(tx=>resolvePayoutReconciliationTx(tx,{reconciliationId:String(b.reconciliationId||''),actorId:u.id,decision:b.decision,adjustmentAmount:b.adjustmentAmount==null?undefined:Number(b.adjustmentAmount),note:b.note,idempotencyKey:key}));
      return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'});
    }
    return NextResponse.json({ok:false,error:'UNKNOWN_RECONCILIATION_ACTION'},{status:400});
  }catch(e){const m=e instanceof Error?e.message:'PAYOUT_RECONCILIATION_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:m.startsWith('INVALID_')||m.endsWith('_REQUIRED')?400:409});}
}
