import type {DeploymentCandidate, DeploymentObservation} from '../deployment-autopilot/contracts.ts';

export type GlobalPhase='PREFLIGHT'|'REGION_CANARY'|'OBSERVE'|'PROMOTE_REGION'|'HALT'|'SHIFT_TRAFFIC'|'ROLLBACK_REGION'|'VERIFY'|'COMPLETE'|'ESCALATE';
export type GlobalDecision='PROMOTE'|'HALT'|'ROLLBACK'|'ESCALATE';
export interface RegionTarget { name:string; ordinal:number; weightPct:number; capacityPct:number; dependencies:string[]; }
export interface RegionObservation extends DeploymentObservation { region:string; trafficWeightPct:number; capacityAvailablePct:number; dependencyHealthy:boolean; }
export interface GlobalRolloutPlan { regions:RegionTarget[]; maxGlobalBlastRadiusPct:number; maxRegionalBlastRadiusPct:number; requireRegionalHealth:boolean; requireSequentialRegions:boolean; allowTrafficShift:boolean; }
export interface GlobalDeploymentAdapter {
  preflight(candidate:DeploymentCandidate):boolean;
  deployRegion(rolloutId:string,region:RegionTarget):boolean;
  shiftTraffic(rolloutId:string,region:string,weightPct:number):boolean;
  promoteRegion(rolloutId:string,region:string):boolean;
  halt(rolloutId:string):boolean;
  rollbackRegion(rolloutId:string,region:string):boolean;
  rollbackGlobal(rolloutId:string):boolean;
  verifyRecovery(rolloutId:string):boolean;
  snapshot():{phase:GlobalPhase;rolloutId:string;activeRegion:string|null;promotedRegions:string[];globalTrafficPct:number;halted:boolean;rolledBack:boolean};
}
export interface GlobalDeploymentInput { deploymentId:string; rolloutId:string; candidate:DeploymentCandidate; plan:GlobalRolloutPlan; observations:Record<string,RegionObservation>; recoveryObservations?:Record<string,RegionObservation>; }
export interface GlobalRegionResult { region:RegionTarget; observation:RegionObservation; passed:boolean; reasons:string[]; }
export interface GlobalDeploymentResult { deploymentId:string; rolloutId:string; phase:GlobalPhase; decision:GlobalDecision; promotedRegions:string[]; globalTrafficPct:number; regionResults:GlobalRegionResult[]; transitions:GlobalPhase[]; runtimeVerified:boolean; evidenceHash:string; }
