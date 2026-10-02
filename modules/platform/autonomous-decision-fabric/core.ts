import type {ActionProposal,DecisionContext,DecisionPlan,DecisionPolicy,ExecutionReceipt,SimulationResult} from './contracts.ts';
const finite=(n:number,k:string)=>{if(!Number.isFinite(n))throw new Error(`${k} must be finite`)};
export function evaluateProposal(ctx:DecisionContext,policy:DecisionPolicy,reason:string,priority:number,signalIds:string[]):ActionProposal{
 if(ctx.tenantId!==policy.tenantId)throw new Error('tenant mismatch');
 if(!policy.enabled)throw new Error('policy disabled');
 finite(priority,'priority');
 const risk=Math.max(0,ctx.riskBps), confidence=Math.max(0,Math.min(10000,ctx.confidenceBps));
 if(risk>policy.maxRiskBps)throw new Error('risk ceiling exceeded');
 if(confidence<policy.minConfidenceBps)throw new Error('confidence floor not met');
 if(policy.maxBudgetMinor!==undefined&&ctx.budgetMinor!==undefined&&ctx.budgetMinor>policy.maxBudgetMinor)throw new Error('budget ceiling exceeded');
 return {proposalId:`prop-${policy.id}-${signalIds.join('-')}`,tenantId:ctx.tenantId,action:policy.action,priority,confidenceBps:confidence,riskBps:risk,expectedImpactBps:Math.max(0,ctx.expectedImpactBps),requiresApproval:policy.autonomy!=='AUTO_EXECUTE',reason,policyId:policy.id,signalIds:[...signalIds],idempotencyKey:`${ctx.tenantId}:${policy.id}:${signalIds.join(',')}`};
}
export function buildDecisionPlan(tenantId:string,proposals:ActionProposal[]):DecisionPlan{
 const seen=new Set<string>();for(const p of proposals){if(p.tenantId!==tenantId)throw new Error('tenant mismatch');if(seen.has(p.idempotencyKey))throw new Error(`duplicate idempotency key ${p.idempotencyKey}`);seen.add(p.idempotencyKey)}
 const sorted=[...proposals].sort((a,b)=>b.priority-a.priority||a.proposalId.localeCompare(b.proposalId));
 const maxRisk=sorted.reduce((m,p)=>Math.max(m,p.riskBps),0);const impact=sorted.reduce((s,p)=>s+p.expectedImpactBps,0);finite(impact,'totalExpectedImpactBps');
 return {planId:`plan-${tenantId}-${sorted.map(p=>p.proposalId).join('|')}`,tenantId,proposals:sorted,totalExpectedImpactBps:impact,maxRiskBps:maxRisk,requiresApproval:sorted.some(p=>p.requiresApproval)};
}
export function simulate(proposal:ActionProposal,baselineScore:number):SimulationResult{finite(baselineScore,'baselineScore');const multiplier=proposal.confidenceBps/10000;const delta=proposal.expectedImpactBps/100*multiplier-(proposal.riskBps/100);return {proposalId:proposal.proposalId,baselineScore,projectedScore:baselineScore+delta,delta,assumptions:['expected impact scales with confidence','risk is treated as a penalty','simulation does not mutate state']};}
export function executeOnce(proposal:ActionProposal,seen:Set<string>,now=Date.now()):ExecutionReceipt{
 if(seen.has(proposal.idempotencyKey))return {proposalId:proposal.proposalId,status:'DUPLICATE',executedAt:now};
 if(proposal.requiresApproval)return {proposalId:proposal.proposalId,status:'PENDING_APPROVAL',executedAt:now};
 seen.add(proposal.idempotencyKey);return {proposalId:proposal.proposalId,status:'EXECUTED',executedAt:now,rollbackToken:`rb-${proposal.proposalId}-${now}`};
}
export function rankForAutonomy(plan:DecisionPlan):ActionProposal[]{return [...plan.proposals].sort((a,b)=>(b.confidenceBps-b.riskBps)-(a.confidenceBps-a.riskBps)||b.priority-a.priority);}
