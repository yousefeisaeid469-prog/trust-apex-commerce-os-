import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../../../modules/platform/db/postgres';
import { getCommerceReliabilityTrace } from '../../../../../../modules/platform/durable-events/reliability-fabric';
import { TRUST_VERSION_NUMBER } from '../../../../../../lib/runtime/version';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:{orderId:string}}){
  if(!databaseConfigured()) return NextResponse.json({ok:false,status:'not_ready',version:TRUST_VERSION_NUMBER,error:'DATABASE_NOT_CONFIGURED'},{status:503,headers:{'cache-control':'no-store'}});
  try{const trace=await getCommerceReliabilityTrace(params.orderId);const ok=trace.trace.state==='HEALTHY';return NextResponse.json({ok,status:trace.trace.state.toLowerCase(),version:TRUST_VERSION_NUMBER,...trace},{status:ok?200:503,headers:{'cache-control':'no-store'}})}
  catch(error){return NextResponse.json({ok:false,status:'unknown',version:TRUST_VERSION_NUMBER,error:error instanceof Error?error.message:'COMMERCE_RELIABILITY_TRACE_FAILED'},{status:503,headers:{'cache-control':'no-store'}})}
}
