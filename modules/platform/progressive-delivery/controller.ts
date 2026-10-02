import {DEFAULT_RELIABILITY_POLICY,type ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import {evaluateStage} from './gate.ts';
import {createProgressiveEvidence} from './evidence.ts';
import type {ProgressiveDeliveryAdapter,ProgressiveDeliveryInput,ProgressiveDeliveryResult,ProgressivePhase,ProgressiveDecision,StageResult} from './contracts.ts';

export function runProgressiveDelivery(input:ProgressiveDeliveryInput,adapter:ProgressiveDeliveryAdapter,policy:ReliabilityPolicy=DEFAULT_RELIABILITY_POLICY):ProgressiveDeliveryResult {
  const transitions:ProgressivePhase[]=['PREFLIGHT']; const stages:StageResult[]=[]; let completedPercent=0;
  if(input.plan.stages.length===0||input.plan.stages.some((s,i)=>s.percent>(input.plan.maxBlastRadiusPct||100)||(i>0&&s.percent<=input.plan.stages[i-1].percent))) return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);
  if(!adapter.preflight(input.candidate)) return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);
  for(const stage of input.plan.stages){
    if(stage.percent>input.plan.maxBlastRadiusPct) return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);
    if(!adapter.startStage(input.rolloutId,stage)) return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);
    transitions.push(stage.percent===1?'CANARY':'OBSERVE','OBSERVE');
    const observation=input.observations[stage.percent];
    if(!observation){adapter.halt(input.rolloutId);transitions.push('HALT');return finalize(input,adapter,'HALT',completedPercent,stages,transitions);}
    const gate=evaluateStage(policy,observation,input.candidate.createdAt);stages.push({stage,observation,gate});
    if(gate.status==='BLOCK'){adapter.halt(input.rolloutId);transitions.push('HALT');
      if(input.rollbackObservation){transitions.push('ROLLBACK');if(!adapter.rollback(input.rolloutId))return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);const rollbackGate=evaluateStage(policy,input.rollbackObservation,input.candidate.createdAt);stages.push({stage:{...stage,ordinal:stage.ordinal+1000,percent:1,regions:stage.regions,observeWindowMs:stage.observeWindowMs},observation:input.rollbackObservation,gate:rollbackGate});if(rollbackGate.status==='PASS'&&adapter.verifyRollback(input.rolloutId)){transitions.push('VERIFY','COMPLETE');return finalize(input,adapter,'ROLLBACK',completedPercent,stages,transitions);} }
      return finalize(input,adapter,'HALT',completedPercent,stages,transitions);
    }
    transitions.push('PROMOTE');if(!adapter.promoteStage(input.rolloutId,stage))return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);completedPercent=stage.percent;
    if(stage.percent===100){transitions.push('COMPLETE');return finalize(input,adapter,'PROMOTE',completedPercent,stages,transitions);}
  }
  return finalize(input,adapter,'ESCALATE',completedPercent,stages,transitions);
}
function finalize(input:ProgressiveDeliveryInput,adapter:ProgressiveDeliveryAdapter,decision:ProgressiveDecision,completedPercent:number,stages:StageResult[],transitions:ProgressivePhase[]):ProgressiveDeliveryResult{const s=adapter.snapshot();const phase:ProgressivePhase=decision==='ESCALATE'?'ESCALATE':decision==='ROLLBACK'?'COMPLETE':decision==='PROMOTE'&&completedPercent===100?'COMPLETE':decision==='HALT'?'HALT':'ESCALATE';const runtimeVerified=decision==='PROMOTE'?s.promotedPercent===100&&!s.halted:decision==='ROLLBACK'?s.rolledBack&&!s.halted:decision==='HALT'?s.halted:true;const base={deploymentId:input.deploymentId,rolloutId:input.rolloutId,phase,decision,completedPercent,stages,transitions,runtimeVerified,evidenceHash:''};return {...base,evidenceHash:createProgressiveEvidence(input.candidate.candidateHash,base).evidenceHash};}
