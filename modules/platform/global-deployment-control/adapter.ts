import type {DeploymentCandidate} from '../deployment-autopilot/contracts.ts';
import type {GlobalDeploymentAdapter,GlobalPhase,RegionTarget} from './contracts.ts';

export class InMemoryGlobalDeploymentAdapter implements GlobalDeploymentAdapter {
  private state={phase:'PREFLIGHT' as GlobalPhase,rolloutId:'',activeRegion:null as string|null,promotedRegions:[] as string[],globalTrafficPct:0,halted:false,rolledBack:false};
  preflight(candidate:DeploymentCandidate){return Boolean(candidate.candidateHash&&candidate.version&&candidate.buildRef&&candidate.migrationFingerprint&&candidate.policyRevision);}
  deployRegion(rolloutId:string,region:RegionTarget){if(this.state.rolloutId&&rolloutId!==this.state.rolloutId)return false;if(region.weightPct<1||region.weightPct>100||region.capacityPct<region.weightPct)return false;this.state={...this.state,rolloutId,activeRegion:region.name,phase:'REGION_CANARY',halted:false};return true;}
  shiftTraffic(rolloutId:string,region:string,weightPct:number){if(rolloutId!==this.state.rolloutId||this.state.halted||region!==this.state.activeRegion||weightPct<1||weightPct>100)return false;this.state={...this.state,phase:'SHIFT_TRAFFIC',globalTrafficPct:weightPct};return true;}
  promoteRegion(rolloutId:string,region:string){if(rolloutId!==this.state.rolloutId||this.state.halted||region!==this.state.activeRegion)return false;this.state={...this.state,phase:'PROMOTE_REGION',promotedRegions:this.state.promotedRegions.includes(region)?this.state.promotedRegions:[...this.state.promotedRegions,region],globalTrafficPct:Math.min(100,this.state.globalTrafficPct)};return true;}
  halt(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'HALT',halted:true};return true;}
  rollbackRegion(rolloutId:string,region:string){if(rolloutId!==this.state.rolloutId||region!==this.state.activeRegion)return false;this.state={...this.state,phase:'ROLLBACK_REGION',rolledBack:true,globalTrafficPct:Math.max(0,this.state.globalTrafficPct-1),halted:true};return true;}
  rollbackGlobal(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'ROLLBACK_REGION',rolledBack:true,globalTrafficPct:0,halted:true};return true;}
  verifyRecovery(rolloutId:string){if(rolloutId!==this.state.rolloutId||!this.state.rolledBack)return false;this.state={...this.state,phase:'VERIFY',halted:false};return true;}
  snapshot(){return {...this.state,promotedRegions:[...this.state.promotedRegions]};}
}
export class FailClosedGlobalDeploymentAdapter implements GlobalDeploymentAdapter {
  preflight(){return false;} deployRegion(){return false;} shiftTraffic(){return false;} promoteRegion(){return false;} halt(){return false;} rollbackRegion(){return false;} rollbackGlobal(){return false;} verifyRecovery(){return false;}
  snapshot(){return {phase:'ESCALATE' as GlobalPhase,rolloutId:'',activeRegion:null,promotedRegions:[],globalTrafficPct:0,halted:true,rolledBack:false};}
}
