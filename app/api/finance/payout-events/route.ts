import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {applyPayoutProviderEvent} from '../../../../modules/platform/v323/financial-close';
export const dynamic='force-dynamic';
const allowed=(role:string)=>['admin','operations'].includes(role);
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!allowed(u.role))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{const b=await req.json();const status=String(b.status) as 'PROCESSING'|'PAID'|'FAILED'|'HELD'|'REVERSED';if(!['PROCESSING','PAID','FAILED','HELD','REVERSED'].includes(status))throw new Error('INVALID_PAYOUT_STATUS');const result=await applyPayoutProviderEvent({payoutId:String(b.payoutId||''),status,providerReference:typeof b.providerReference==='string'?b.providerReference:undefined,failureCode:typeof b.failureCode==='string'?b.failureCode:undefined,idempotencyKey:key});return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});}
  catch(e){const m=e instanceof Error?e.message:'PAYOUT_EVENT_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:400});}
}
