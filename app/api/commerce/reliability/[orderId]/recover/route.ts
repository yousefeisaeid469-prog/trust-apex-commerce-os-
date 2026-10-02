import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../../../modules/platform/db/postgres';
import { runVerifiedOrderRecovery, getLatestOrderRecovery } from '../../../../../../modules/platform/durable-events/reliability-recovery';
import { TRUST_VERSION_NUMBER } from '../../../../../../lib/runtime/version';
export const dynamic='force-dynamic'; export const runtime='nodejs';

export async function POST(request:Request,{params}:{params:{orderId:string}}){
  if(!databaseConfigured()) return NextResponse.json({ok:false,status:'not_ready',version:TRUST_VERSION_NUMBER,error:'DATABASE_NOT_CONFIGURED'},{status:503});
  const secret=process.env.CRON_SECRET;
  if(secret && request.headers.get('authorization')!==`Bearer ${secret}`) return NextResponse.json({ok:false,error:'UNAUTHORIZED'},{status:401});
  try{
    const result=await runVerifiedOrderRecovery(params.orderId,'api');
    return NextResponse.json({ok:true,version:TRUST_VERSION_NUMBER,...result},{status:result.verified?200:409,headers:{'cache-control':'no-store'}});
  }catch(error){
    return NextResponse.json({ok:false,version:TRUST_VERSION_NUMBER,error:error instanceof Error?error.message:'ORDER_RECOVERY_FAILED'},{status:503,headers:{'cache-control':'no-store'}});
  }
}

export async function GET(_request:Request,{params}:{params:{orderId:string}}){
  if(!databaseConfigured()) return NextResponse.json({ok:false,status:'not_ready',version:TRUST_VERSION_NUMBER,error:'DATABASE_NOT_CONFIGURED'},{status:503});
  try{return NextResponse.json({ok:true,version:TRUST_VERSION_NUMBER,recovery:await getLatestOrderRecovery(params.orderId)},{headers:{'cache-control':'no-store'}})}
  catch(error){return NextResponse.json({ok:false,version:TRUST_VERSION_NUMBER,error:error instanceof Error?error.message:'ORDER_RECOVERY_HISTORY_FAILED'},{status:503})}
}
