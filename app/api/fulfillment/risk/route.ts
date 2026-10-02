import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '@/modules/platform/auth/current-user';
import {getFulfillmentRiskSnapshot} from '@/modules/platform/fulfillment-providers/operations';
const privileged=['admin','support','operations'];
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(req:NextRequest){
  const u=await getCurrentUser(req);
  if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401});
  if(!privileged.includes(u.role))return NextResponse.json({ok:false,error:'PRIVILEGED_ACCESS_REQUIRED',surfaceStatus:'ERROR'},{status:403});
  try{const limit=Number(new URL(req.url).searchParams.get('limit')??100);return NextResponse.json({ok:true,surfaceStatus:'LIVE',risk:await getFulfillmentRiskSnapshot(limit)},{headers:{'Cache-Control':'no-store'}})}
  catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'FULFILLMENT_RISK_ERROR',surfaceStatus:'ERROR'},{status:400})}
}
