import {DEFAULT_RELIABILITY_POLICY,type ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import {evaluateRegion} from './gate.ts';
import {createGlobalDeploymentEvidence} from './evidence.ts';
import type {GlobalDeploymentAdapter,GlobalDeploymentInput,GlobalDeploymentResult,GlobalPhase,GlobalDecision,GlobalRegionResult} from './contracts.ts';

export function runGlobalDeployment(input:GlobalDeploymentInput,adapter:GlobalDeploymentAdapter,policy:ReliabilityPolicy=DEFAULT_RELIABILITY_POLICY):GlobalDeploymentResult{
  const transitions:GlobalPhase[]=['PREFLIGHT']; const results:GlobalRegionResult[]=[];
  const regions=input.plan.regions;
  const valid=regions.length>0&&regions.every((r,i)=>r.ordinal===i&&r.weightPct>=1&&r.weightPct<=100&&r.capacityPct>=r.weightPct&&(i===0||r.weightPct>=regions[i-1].weightPct))&&input.plan.maxGlobalBlastRadiusPct<=100&&input.plan.maxRegionalBlastRadiusPct<=100;
  if(!valid)return finalize(input,adapter,'ESCALATE',results,transitions);
  if(!adapter.preflight(input.candidate))return finalize(input,adapter,'ESCALATE',results,transitions);
  for(let i=0;i<regions.length;i++){
    const region=regions[i];
    if(input.plan.requireSequentialRegions&&i>0&&!adapter.snapshot().promotedRegions.includes(regions[i-1].name))return finalize(input,adapter,'ESCALATE',results,transitions);
    if(region.weightPct>input.plan.maxRegionalBlastRadiusPct||region.weightPct>input.plan.maxGlobalBlastRadiusPct)return finalize(input,adapter,'ESCALATE',results,transitions);
    if(!adapter.deployRegion(input.rolloutId,region))return finalize(input,adapter,'ESCALATE',results,transitions);
    transitions.push('REGION_CANARY','OBSERVE');
    const observation=input.observations[region.name];
    if(!observation){adapter.halt(input.rolloutId);transitions.push('HALT');return finalize(input,adapter,'HALT',results,transitions);}
    const gate=evaluateRegion(policy,input.plan,observation);results.push({region,observation,passed:gate.passed,reasons:gate.reasons});
    if(!gate.passed){adapter.halt(input.rolloutId);transitions.push('HALT','ROLLBACK_REGION');const recovery=input.recoveryObservations?.[region.name];if(recovery&&adapter.rollbackRegion(input.rolloutId,region.name)){const recoveryGate=evaluateRegion(policy,input.plan,recovery);if(recoveryGate.passed&&adapter.verifyRecovery(input.rolloutId)){transitions.push('VERIFY');return finalize(input,adapter,'ROLLBACK',results,transitions);}}return finalize(input,adapter,'HALT',results,transitions);}
    if(input.plan.allowTrafficShift){transitions.push('SHIFT_TRAFFIC');if(!adapter.shiftTraffic(input.rolloutId,region.name,region.weightPct))return finalize(input,adapter,'ESCALATE',results,transitions);}
    transitions.push('PROMOTE_REGION');if(!adapter.promoteRegion(input.rolloutId,region.name))return finalize(input,adapter,'ESCALATE',results,transitions);
  }
  transitions.push('COMPLETE');return finalize(input,adapter,'PROMOTE',results,transitions);
}
function finalize(input:GlobalDeploymentInput,adapter:GlobalDeploymentAdapter,decision:GlobalDecision,regionResults:GlobalRegionResult[],transitions:GlobalPhase[]):GlobalDeploymentResult{const s=adapter.snapshot();const phase:GlobalPhase=decision==='PROMOTE'?'COMPLETE':decision==='ROLLBACK'?'VERIFY':decision==='HALT'?'HALT':'ESCALATE';const runtimeVerified=decision==='PROMOTE'?s.promotedRegions.length===input.plan.regions.length&&!s.halted&&s.globalTrafficPct<=100:decision==='ROLLBACK'?s.rolledBack&&!s.halted:decision==='HALT'?s.halted:false;const base={deploymentId:input.deploymentId,rolloutId:input.rolloutId,phase,decision,promotedRegions:s.promotedRegions,globalTrafficPct:s.globalTrafficPct,regionResults,transitions,runtimeVerified};return {...base,evidenceHash:createGlobalDeploymentEvidence(input.candidate.candidateHash,base).evidenceHash};}
