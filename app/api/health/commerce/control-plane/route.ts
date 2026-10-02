import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../../modules/platform/db/postgres';
import { captureCommerceOperationsSnapshot } from '../../../../../modules/platform/durable-events/operations-brain';
import { TRUST_VERSION_NUMBER } from '../../../../../lib/runtime/version';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){
  if(!databaseConfigured()) return NextResponse.json({ok:false,status:'not_ready',version:TRUST_VERSION_NUMBER,error:'DATABASE_NOT_CONFIGURED'},{status:503,headers:{'cache-control':'no-store'}});
  try{const observation=await captureCommerceOperationsSnapshot();return NextResponse.json({ok:observation.state==='HEALTHY',version:TRUST_VERSION_NUMBER,...observation},{status:observation.state==='HEALTHY'?200:503,headers:{'cache-control':'no-store'}})}
  catch(error){return NextResponse.json({ok:false,status:'unknown',version:TRUST_VERSION_NUMBER,error:error instanceof Error?error.message:'COMMERCE_OPERATIONS_FAILED'},{status:503,headers:{'cache-control':'no-store'}})}
}
