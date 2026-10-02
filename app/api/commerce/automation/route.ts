import { NextResponse } from 'next/server';
import { getAutomationOverview,createAutomationPlan } from '../../../../modules/platform/global-commerce-automation/core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(request:Request){try{return NextResponse.json({ok:true,...await getAutomationOverview(Number(new URL(request.url).searchParams.get('limit')||20))},{headers:{'cache-control':'no-store'}})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'AUTOMATION_UNAVAILABLE'},{status:503})}}
export async function POST(request:Request){try{const body=await request.json();return NextResponse.json({ok:true,plan:await createAutomationPlan({fingerprint:String(body?.fingerprint||''),requestId:request.headers.get('x-request-id')||undefined})},{status:201})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'AUTOMATION_PLAN_FAILED'},{status:400})}}
