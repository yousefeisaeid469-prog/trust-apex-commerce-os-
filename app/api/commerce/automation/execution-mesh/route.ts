import { NextResponse } from 'next/server';
import { requireOwnerSession } from '../../../../../modules/platform/security/owner-auth';
import { enqueueDecisionCommand,getExecutionMeshOverview } from '../../../../../modules/platform/global-commerce-automation/execution-mesh';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){try{return NextResponse.json({ok:true,...await getExecutionMeshOverview()},{headers:{'cache-control':'no-store'}})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'EXECUTION_MESH_UNAVAILABLE'},{status:503})}}
export async function POST(request:Request){try{const owner=await requireOwnerSession(request);const b=await request.json();if(String(b?.operation||'').toUpperCase()!=='ENQUEUE')throw new Error('UNKNOWN_EXECUTION_MESH_OPERATION');return NextResponse.json({ok:true,...await enqueueDecisionCommand(String(b.commandId||'')),requestedBy:owner.email},{status:202})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'EXECUTION_MESH_ACTION_FAILED'},{status:400})}}
