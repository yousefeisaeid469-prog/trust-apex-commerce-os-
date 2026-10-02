import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../modules/platform/db/postgres';
import { captureConsumerHealthSnapshots, recoverStaleConsumerDeliveries } from '../../../../modules/platform/durable-events/consumer-control-plane';
export const dynamic='force-dynamic'; export const runtime='nodejs'; export const maxDuration=60;
function authorized(request:Request){const expected=process.env.CRON_SECRET?.trim();return !!expected&&request.headers.get('authorization')===`Bearer ${expected}`;}
export async function GET(request:Request){
 if(!authorized(request)) return NextResponse.json({ok:false,error:'CRON_UNAUTHORIZED'},{status:401,headers:{'cache-control':'no-store'}});
 if(!databaseConfigured()) return NextResponse.json({ok:false,error:'DATABASE_NOT_CONFIGURED'},{status:503,headers:{'cache-control':'no-store'}});
 try{const recovery=await recoverStaleConsumerDeliveries();const consumers=await captureConsumerHealthSnapshots();const degraded=consumers.filter(x=>x.state!=='HEALTHY').length;return NextResponse.json({ok:true,recovery,health:{degraded,consumers},trigger:'vercel-cron'},{status:degraded===0?200:503,headers:{'cache-control':'no-store'}})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'CONSUMER_CONTROL_CRON_FAILED'},{status:503,headers:{'cache-control':'no-store'}})}
}
export async function POST(request:Request){return GET(request)}
