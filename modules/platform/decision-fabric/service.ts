import { buildEvidenceChain, evaluateDecision, validateEvidence, type DecisionRequest } from './index';
import { persistDecision } from './persistence';
export async function evaluateAndPersistDecision(request:DecisionRequest){
  const tenantId=request.tenantId??'default';
  const raw=request.evidence?.length?request.evidence:buildEvidenceChain(request.subjectId);
  const evidence=validateEvidence(raw,tenantId,{trustedIngress:false}).map(e=>({...e,tenantId}));
  const decision=evaluateDecision({...request,evidence,tenantId});
  const persisted=await persistDecision({decision,evidence,tenantId,actorId:request.actorId});
  return {decision,persisted:persisted.persisted,auditHash:persisted.auditHash,mode:'durable'};
}
