import type {DeploymentCandidate} from '../deployment-autopilot/contracts.ts';
import type {ProgressiveDeliveryAdapter,ProgressivePhase,RolloutStage} from './contracts.ts';

export class InMemoryProgressiveDeliveryAdapter implements ProgressiveDeliveryAdapter {
  private state={phase:'PREFLIGHT' as ProgressivePhase,rolloutId:'',currentPercent:0,promotedPercent:0,halted:false,rolledBack:false};
  preflight(candidate:DeploymentCandidate){return Boolean(candidate.candidateHash&&candidate.version&&candidate.buildRef&&candidate.migrationFingerprint&&candidate.policyRevision);}
  startStage(rolloutId:string,stage:RolloutStage){if(rolloutId!==this.state.rolloutId && this.state.rolloutId) return false;if(!stage.percent||stage.percent<1)return false;this.state={...this.state,phase:stage.percent===1?'CANARY':'OBSERVE',rolloutId,currentPercent:stage.percent,halted:false};return true;}
  promoteStage(rolloutId:string,stage:RolloutStage){if(rolloutId!==this.state.rolloutId||this.state.halted||stage.percent!==this.state.currentPercent)return false;this.state={...this.state,phase:'PROMOTE',promotedPercent:stage.percent};if(stage.percent===100)this.state.phase='COMPLETE';return true;}
  halt(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'HALT',halted:true};return true;}
  rollback(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'ROLLBACK',rolledBack:true,halted:true,currentPercent:0,promotedPercent:0};return true;}
  verifyRollback(rolloutId:string){if(rolloutId!==this.state.rolloutId||!this.state.rolledBack)return false;this.state={...this.state,phase:'VERIFY',halted:false};return true;}
  snapshot(){return {...this.state};}
}
export class FailClosedProgressiveDeliveryAdapter implements ProgressiveDeliveryAdapter {
  preflight(){return false;} startStage(){return false;} promoteStage(){return false;} halt(){return false;} rollback(){return false;} verifyRollback(){return false;}
  snapshot(){return {phase:'ESCALATE' as ProgressivePhase,rolloutId:'',currentPercent:0,promotedPercent:0,halted:true,rolledBack:false};}
}
