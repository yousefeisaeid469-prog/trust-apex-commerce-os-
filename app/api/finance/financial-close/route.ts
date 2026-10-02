import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {runFinancialClose,financialCloseHistory} from '../../../../modules/platform/v323/financial-close';
export const dynamic='force-dynamic';
const allowed=(role:string)=>['admin','operations'].includes(role);
export async function GET(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!allowed(u.role))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  return NextResponse.json({ok:true,runs:await financialCloseHistory(Number(new URL(req.url).searchParams.get('limit')||50)),surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
  const u=await getCurrentUser(req); if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!allowed(u.role))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const key=req.headers.get('idempotency-key')?.trim(); if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{const b=await req.json();const result=await runFinancialClose({scope:typeof b.scope==='string'?b.scope:undefined,merchantId:typeof b.merchantId==='string'?b.merchantId:undefined,idempotencyKey:key});return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});}
  catch(e){const m=e instanceof Error?e.message:'FINANCIAL_CLOSE_FAILED';return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:400});}
}
