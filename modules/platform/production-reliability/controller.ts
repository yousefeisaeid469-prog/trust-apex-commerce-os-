import {runAutonomousReliabilityLoop} from '../autonomous-reliability-loop/loop.ts';
import {DEFAULT_RELIABILITY_POLICY,type ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import type {ProductionReliabilityCycleInput,ProductionReliabilityCycleResult,ProductionReliabilityRuntime} from './contracts.ts';

export function runProductionReliabilityCycle(input:ProductionReliabilityCycleInput,runtime:ProductionReliabilityRuntime,policy:ReliabilityPolicy=DEFAULT_RELIABILITY_POLICY,recoveryResult?:ProductionReliabilityCycleInput['result'],rollbackResult?:ProductionReliabilityCycleInput['result']):ProductionReliabilityCycleResult {
  const signal=runtime.getReliabilitySignal({serviceId:input.serviceId,tenantId:input.tenantId,rolloutId:input.rolloutId});
  const loop=runAutonomousReliabilityLoop({incidentId:input.incidentId,signal,result:input.result,rolloutId:input.rolloutId,blastRadius:input.blastRadius,mitigationReason:input.mitigationReason},runtime,policy,recoveryResult,undefined,rollbackResult);
  const terminal=loop.status==='RECOVERED'?'RECOVERED':loop.status==='ROLLED_BACK'?'ROLLED_BACK':'ESCALATED';
  runtime.transition({incidentId:input.incidentId,status:terminal,decision:loop.decision});
  const snap=runtime.snapshot() as import('./contracts.ts').ProductionRuntimeState;
  const runtimeVerified=loop.status==='RECOVERED'?(!snap.frozenRollouts.includes(input.rolloutId)):loop.status==='ROLLED_BACK'?snap.rolledBackRollouts.includes(input.rolloutId):snap.frozenRollouts.includes(input.rolloutId);
  if(!runtimeVerified) throw new Error('RUNTIME_STATE_VERIFICATION_FAILED');
  return {signal,loop,runtimeVerified,incident:{status:terminal,decision:loop.decision}};
}
