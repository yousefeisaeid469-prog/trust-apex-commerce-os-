import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../modules/platform/db/postgres';
import { captureCommerceOperationsSnapshot, runCommerceOperationsRecovery } from '../../../../modules/platform/durable-events/operations-brain';
export const dynamic='force-dynamic'; export const runtime='nodejs'; export const maxDuration=60;
function authorized(request:Request){const expected=process.env.CRON_SECRET?.trim();return !!expected&&request.headers.get('authorization')===`Bearer ${expected}`;}
export async function GET(request:Request){
 if(!authorized(request)) return NextResponse.json({ok:false,error:'CRON_UNAUTHORIZED'},{status:401});
 if(!databaseConfigured()) return NextResponse.json({ok:false,error:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const recovery=await runCommerceOperationsRecovery();const observation=await captureCommerceOperationsSnapshot();return NextResponse.json({ok:true,recovery,observation,trigger:'vercel-cron'},{status:observation.state==='CRITICAL'?503:200,headers:{'cache-control':'no-store'}})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'COMMERCE_OPERATIONS_CRON_FAILED'},{status:503})}
}
export async function POST(request:Request){return GET(request)}
