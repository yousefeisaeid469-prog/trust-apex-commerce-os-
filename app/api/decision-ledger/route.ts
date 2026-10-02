import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '../../../modules/platform/auth/current-user';
import { buildEvidenceChain, type DecisionOutcome } from '../../../modules/platform/decision-fabric';
import { evaluateAndPersistDecision } from '../../../modules/platform/decision-fabric/service';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){
  try{
    const actor=await requirePermission(req,'trust:ledger'); const b=await req.json().catch(()=>({}));
    const subjectId=String(b?.subjectId||'unknown-subject');
    const result=await evaluateAndPersistDecision({subjectId,action:String(b?.action||'LEDGER_RECORD'),impact:b?.impact||'MEDIUM',evidence:Array.isArray(b?.evidence)?b.evidence:buildEvidenceChain(subjectId),tenantId:typeof b?.tenantId==='string'?b.tenantId:'default',actorId:actor.id,traceId:typeof b?.traceId==='string'?b.traceId:undefined});
    const requestedOutcome=typeof b?.outcome==='string'?b.outcome as DecisionOutcome:undefined;
    if(requestedOutcome && requestedOutcome!==result.decision.outcome)return NextResponse.json({ok:false,error:'OUTCOME_MISMATCH',actualOutcome:result.decision.outcome,persisted:false},{status:409});
    return NextResponse.json({accepted:true,mode:'durable',decisionId:result.decision.id,persisted:result.persisted,auditHash:result.auditHash,outcome:result.decision.outcome},{headers:{'Cache-Control':'no-store'}});
  }catch(e){const code=e instanceof Error?e.message:'DECISION_LEDGER_ERROR';const status=code==='Authentication required'?401:code.includes('permission')?403:code==='DATABASE_NOT_CONFIGURED'?503:400;return NextResponse.json({accepted:false,mode:'durable',persisted:false,error:code},{status});}
}
