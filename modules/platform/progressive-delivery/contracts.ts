import type {DeploymentCandidate, DeploymentObservation, DeploymentGate} from '../deployment-autopilot/contracts.ts';

export const DEFAULT_ROLLOUT_STAGES = [1,5,25,50,100] as const;
export type RolloutPercent = typeof DEFAULT_ROLLOUT_STAGES[number];
export type ProgressivePhase = 'PREFLIGHT'|'CANARY'|'OBSERVE'|'PROMOTE'|'HALT'|'ROLLBACK'|'VERIFY'|'COMPLETE'|'ESCALATE';
export type ProgressiveDecision = 'PROMOTE'|'HALT'|'ROLLBACK'|'ESCALATE';

export interface RolloutStage { ordinal:number; percent:RolloutPercent; regions:string[]; observeWindowMs:number; }
export interface StageResult { stage:RolloutStage; observation:DeploymentObservation; gate:DeploymentGate; }
export interface ProgressiveDeliveryPlan { stages:RolloutStage[]; maxBlastRadiusPct:number; rollbackBudgetPct:number; requireSequentialPromotion:boolean; }
export interface ProgressiveDeliveryAdapter {
  preflight(candidate:DeploymentCandidate):boolean;
  startStage(rolloutId:string,stage:RolloutStage):boolean;
  promoteStage(rolloutId:string,stage:RolloutStage):boolean;
  halt(rolloutId:string):boolean;
  rollback(rolloutId:string):boolean;
  verifyRollback(rolloutId:string):boolean;
  snapshot():{phase:ProgressivePhase;rolloutId:string;currentPercent:number;promotedPercent:number;halted:boolean;rolledBack:boolean};
}
export interface ProgressiveDeliveryInput {
  deploymentId:string; rolloutId:string; candidate:DeploymentCandidate; plan:ProgressiveDeliveryPlan;
  observations:Record<number,DeploymentObservation>;
  rollbackObservation?:DeploymentObservation;
}
export interface ProgressiveDeliveryResult {
  deploymentId:string; rolloutId:string; phase:ProgressivePhase; decision:ProgressiveDecision;
  completedPercent:number; stages:StageResult[]; transitions:ProgressivePhase[]; runtimeVerified:boolean; evidenceHash:string;
}
