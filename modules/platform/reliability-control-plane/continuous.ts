import {generateCase,generateFaults,executeCase,shrinkFailure,replay} from '../reliability-lab/engine.ts';
import {classifyFailure,isKnownFailure} from './corpus.ts';
import {evaluateReleaseGate, type GateVerdict} from './gate.ts';
import {DEFAULT_RELIABILITY_POLICY,type ReliabilityPolicy} from './policy.ts';
export type ControlPlaneRun={campaignId:string;seed:number;verdict:GateVerdict;failureHash?:string;replayMatches:boolean;operations:number};
export function runContinuousReliability(campaignId:string,seed:number,knownHashes:Set<string>=new Set(),policy:ReliabilityPolicy=DEFAULT_RELIABILITY_POLICY):ControlPlaneRun{
 const ops=generateCase(seed,40),faults=generateFaults(seed,ops,.2); const raw=executeCase(seed,ops,faults); const result=raw.status==='FAIL'?shrinkFailure(seed,ops,faults):raw; const replayed=replay(result); const replayMatches=replayed.fingerprint===result.fingerprint; const record=classifyFailure(result,replayed.fingerprint); const known=isKnownFailure(record.failureHash,knownHashes); const verdict=evaluateReleaseGate(policy,{result,replayStatus:replayMatches?'PASS':'FAIL',knownFailure:known}); return {campaignId,seed,verdict,failureHash:result.status==='FAIL'?record.failureHash:undefined,replayMatches,operations:result.operations.length};
}
