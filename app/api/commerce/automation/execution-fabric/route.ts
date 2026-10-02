import { NextResponse } from 'next/server';
import { requireOwnerSession } from '../../../../../modules/platform/security/owner-auth';
import { createExecutionWorkflow,getExecutionFabricOverview } from '../../../../../modules/platform/global-commerce-automation/execution-fabric';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){try{return NextResponse.json({ok:true,...await getExecutionFabricOverview()},{headers:{'cache-control':'no-store'}})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'EXECUTION_FABRIC_UNAVAILABLE'},{status:503})}}
export async function POST(request:Request){try{const owner=await requireOwnerSession(request);const b=await request.json();if(String(b?.operation||'').toUpperCase()!=='CREATE_WORKFLOW')throw new Error('UNKNOWN_EXECUTION_FABRIC_OPERATION');return NextResponse.json({ok:true,...await createExecutionWorkflow(String(b.commandId||''),String(b.tenantId||'global')),requestedBy:owner.email},{status:202})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'EXECUTION_FABRIC_ACTION_FAILED'},{status:400})}}
