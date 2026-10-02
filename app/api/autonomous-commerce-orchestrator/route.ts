import { NextRequest, NextResponse } from 'next/server';
import { databaseConfigured, query } from '../../../modules/platform/db/postgres.ts';
import { getDurableOrchestration } from '../../../modules/platform/autonomous-commerce-orchestrator/durable.ts';
import { consumeAutonomousOrchestration } from '../../../modules/platform/autonomous-commerce-orchestrator/consumer.ts';
import { TRUST_VERSION_NUMBER } from '../../../lib/runtime/version.ts';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export const getDurableOrchestrationRun = getDurableOrchestration;

export async function GET(req:NextRequest){
  if(!databaseConfigured()) return NextResponse.json({ok:false,error:'DATABASE_NOT_CONFIGURED',version:TRUST_VERSION_NUMBER},{status:503,headers:{'cache-control':'no-store'}});
  const key=req.nextUrl.searchParams.get('idempotencyKey');
  if(!key) return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  const run=await getDurableOrchestrationRun(key);
  return NextResponse.json({ok:Boolean(run),run},{status:run?200:404,headers:{'cache-control':'no-store'}});
}

export async function POST(req:NextRequest){
  if(!databaseConfigured()) return NextResponse.json({ok:false,error:'DATABASE_NOT_CONFIGURED',version:TRUST_VERSION_NUMBER},{status:503});
  try{
    const event=await req.json();
    const run=await consumeAutonomousOrchestration(event);
    return NextResponse.json({ok:true,run,version:TRUST_VERSION_NUMBER},{status:200});
  }catch(error){
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:'AUTONOMOUS_ORCHESTRATION_FAILED',version:TRUST_VERSION_NUMBER},{status:400});
  }
}
