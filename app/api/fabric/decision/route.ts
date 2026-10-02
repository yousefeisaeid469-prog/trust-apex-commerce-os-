import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '../../../../modules/platform/auth/current-user';
import { evaluateAndPersistDecision } from '../../../../modules/platform/decision-fabric/service';
import { buildEvidenceChain } from '../../../../modules/platform/decision-fabric';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){
  try{const actor=await requirePermission(req,'trust:decision');const b=await req.json().catch(()=>({}));const subjectId=String(b?.subjectId||'unknown-subject');const result=await evaluateAndPersistDecision({subjectId,action:String(b?.action||'FABRIC_DECISION'),impact:b?.impact||'MEDIUM',evidence:Array.isArray(b?.evidence)?b.evidence:buildEvidenceChain(subjectId),tenantId:typeof b?.tenantId==='string'?b.tenantId:'default',actorId:actor.id});return NextResponse.json({status:'decision-recorded',simulationFirst:false,policyChecked:true,approvalGate:result.decision.humanReviewRequired,audit:{persisted:true,chainHash:result.auditHash},decision:result.decision},{headers:{'Cache-Control':'no-store'}});}catch(e){const code=e instanceof Error?e.message:'FABRIC_DECISION_ERROR';return NextResponse.json({ok:false,error:code,persisted:false},{status:code==='Authentication required'?401:code.includes('permission')?403:code==='DATABASE_NOT_CONFIGURED'?503:400});}
}
