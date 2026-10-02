import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../../modules/platform/db/postgres';
import { captureConsumerHealthSnapshots } from '../../../../../modules/platform/durable-events/consumer-control-plane';
import { TRUST_VERSION_NUMBER } from '../../../../../lib/runtime/version';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){
 if(!databaseConfigured()) return NextResponse.json({ok:false,status:'not_ready',version:TRUST_VERSION_NUMBER,error:'DATABASE_NOT_CONFIGURED'},{status:503,headers:{'cache-control':'no-store'}});
 try{const consumers=await captureConsumerHealthSnapshots();const degraded=consumers.filter(x=>x.state!=='HEALTHY').length;return NextResponse.json({ok:degraded===0,status:degraded===0?'healthy':'degraded',version:TRUST_VERSION_NUMBER,observedAt:new Date().toISOString(),consumers},{status:degraded===0?200:503,headers:{'cache-control':'no-store'}})}catch(error){return NextResponse.json({ok:false,status:'unknown',version:TRUST_VERSION_NUMBER,error:error instanceof Error?error.message:'CONSUMER_HEALTH_FAILED'},{status:503,headers:{'cache-control':'no-store'}})}
}
