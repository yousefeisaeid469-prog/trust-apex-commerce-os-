import type {LabResult} from '../reliability-lab/engine.ts';
import type {ProductionEvidenceBundle} from '../production-reliability/evidence.ts';

export type DeploymentPhase = 'PREFLIGHT'|'CANARY'|'OBSERVE'|'PROMOTE'|'FREEZE'|'ROLLBACK'|'VERIFY'|'COMPLETE'|'FAILED';
export type DeploymentDecision = 'PROMOTE'|'FREEZE'|'ROLLBACK'|'ESCALATE';

export interface DeploymentCandidate {
  candidateHash:string; version:string; buildRef:string; sourceFingerprint:string;
  migrationFingerprint:string; policyRevision:string; createdAt:string;
}
export interface DeploymentObservation {
  availability:number; errorRate:number; p95Ms:number; budgetConsumedPct:number;
  replayMatches:boolean; newFailure:boolean; labResult:LabResult;
}
export interface DeploymentGate {
  status:'PASS'|'BLOCK'; reasons:string[]; observedAt:string;
}
export interface DeploymentAdapter {
  preflight(candidate:DeploymentCandidate):boolean;
  canary(candidate:DeploymentCandidate,rolloutId:string):boolean;
  promote(rolloutId:string):boolean;
  freeze(rolloutId:string):boolean;
  rollback(rolloutId:string):boolean;
  resume(rolloutId:string):boolean;
  snapshot():{phase:DeploymentPhase;rolloutId:string;promoted:boolean;frozen:boolean;rolledBack:boolean};
}
export interface DeploymentEvidenceStore { record(bundle:ProductionEvidenceBundle):void; get(candidateHash:string):ProductionEvidenceBundle|undefined; }
export interface DeploymentAutopilotInput {
  deploymentId:string; rolloutId:string; candidate:DeploymentCandidate;
  canary:DeploymentObservation; recovery?:DeploymentObservation; rollbackVerification?:DeploymentObservation;
}
export interface DeploymentAutopilotResult {
  deploymentId:string; rolloutId:string; phase:DeploymentPhase; decision:DeploymentDecision;
  gates:DeploymentGate[]; transitions:DeploymentPhase[]; runtimeVerified:boolean; evidenceHash:string;
}
