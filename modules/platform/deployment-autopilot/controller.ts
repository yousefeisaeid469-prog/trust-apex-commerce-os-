import {createHash} from 'node:crypto';
import {DEFAULT_RELIABILITY_POLICY,type ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import {evaluateDeploymentObservation} from './gate.ts';
import {createDeploymentEvidence} from './evidence.ts';
import type {DeploymentAdapter,DeploymentAutopilotInput,DeploymentAutopilotResult,DeploymentPhase} from './contracts.ts';

export function runDeploymentAutopilot(input:DeploymentAutopilotInput,adapter:DeploymentAdapter,policy:ReliabilityPolicy=DEFAULT_RELIABILITY_POLICY):DeploymentAutopilotResult {
  const transitions:DeploymentPhase[]=['PREFLIGHT']; const gates=[] as ReturnType<typeof evaluateDeploymentObservation>[];
  if(!adapter.preflight(input.candidate)) return fail(input,adapter,transitions,'ESCALATE',gates,'preflight-failed');
  if(!adapter.canary(input.candidate,input.rolloutId)) return fail(input,adapter,transitions,'ESCALATE',gates,'canary-start-failed');
  transitions.push('CANARY','OBSERVE');
  const canaryGate=evaluateDeploymentObservation(policy,input.canary,input.candidate.createdAt); gates.push(canaryGate);
  if(canaryGate.status==='PASS') {
    transitions.push('PROMOTE');
    if(!adapter.promote(input.rolloutId)) return fail(input,adapter,transitions,'ESCALATE',gates,'promotion-failed');
    transitions.push('COMPLETE');
    return finalize(input,adapter,transitions,'PROMOTE',gates);
  }
  transitions.push('FREEZE'); adapter.freeze(input.rolloutId);
  if(input.recovery){const recoveryGate=evaluateDeploymentObservation(policy,input.recovery,input.candidate.createdAt);gates.push(recoveryGate);if(recoveryGate.status==='PASS'){adapter.resume(input.rolloutId);transitions.push('VERIFY','PROMOTE');if(!adapter.promote(input.rolloutId)) return fail(input,adapter,transitions,'ESCALATE',gates,'promotion-after-recovery-failed');transitions.push('COMPLETE');return finalize(input,adapter,transitions,'PROMOTE',gates);}}
  transitions.push('ROLLBACK');
  if(!adapter.rollback(input.rolloutId)) return fail(input,adapter,transitions,'ESCALATE',gates,'rollback-failed');
  if(input.rollbackVerification){const rollbackGate=evaluateDeploymentObservation(policy,input.rollbackVerification,input.candidate.createdAt);gates.push(rollbackGate);if(rollbackGate.status==='PASS'){adapter.resume(input.rolloutId);transitions.push('VERIFY','COMPLETE');return finalize(input,adapter,transitions,'ROLLBACK',gates);}}
  return fail(input,adapter,transitions,'ESCALATE',gates,'rollback-verification-failed');
}
function fail(input:DeploymentAutopilotInput,adapter:DeploymentAdapter,transitions:DeploymentPhase[],decision:'ESCALATE',gates:ReturnType<typeof evaluateDeploymentObservation>[],reason:string):DeploymentAutopilotResult { const last=adapter.snapshot(); const result={deploymentId:input.deploymentId,rolloutId:input.rolloutId,phase:'FAILED' as DeploymentPhase,decision,gates:[...gates,{status:'BLOCK' as const,reasons:[reason],observedAt:input.candidate.createdAt}],transitions,runtimeVerified:last.frozen||last.rolledBack,evidenceHash:''}; return {...result,evidenceHash:createDeploymentEvidence(input.candidate.candidateHash,result).evidenceHash}; }
function finalize(input:DeploymentAutopilotInput,adapter:DeploymentAdapter,transitions:DeploymentPhase[],decision:'PROMOTE'|'ROLLBACK',gates:ReturnType<typeof evaluateDeploymentObservation>[]):DeploymentAutopilotResult {const s=adapter.snapshot();const runtimeVerified=decision==='PROMOTE'?(s.promoted&&!s.frozen):(!s.frozen&&s.rolledBack);const phase=s.phase==='VERIFY'?'COMPLETE':s.phase;const base={deploymentId:input.deploymentId,rolloutId:input.rolloutId,phase,decision,gates,transitions,runtimeVerified,evidenceHash:''};return {...base,evidenceHash:createDeploymentEvidence(input.candidate.candidateHash,base).evidenceHash};}
