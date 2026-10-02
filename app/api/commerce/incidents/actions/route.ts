import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireOwnerSession } from '../../../../../modules/platform/security/owner-auth';
import { executeSafeIncidentAction } from '../../../../../modules/platform/global-commerce-incident-orchestrator/core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(request:Request){
  let owner; try{owner=await requireOwnerSession(request);}catch(error){const code=error instanceof Error?error.message:'OWNER_AUTH_REQUIRED'; return NextResponse.json({ok:false,error:code},{status:401});}
  const body=await request.json().catch(()=>({}));
  try{const result=await executeSafeIncidentAction({fingerprint:String(body?.fingerprint||''),commandId:'RECOVER_ORDER_LEASES',orderId:String(body?.orderId||''),actorEmail:owner.email,reason:String(body?.reason||''),requestId:request.headers.get('x-request-id')||randomUUID()});return NextResponse.json({ok:true,...result},{headers:{'cache-control':'no-store'}});}
  catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'INCIDENT_ACTION_FAILED'},{status:400});}
}
