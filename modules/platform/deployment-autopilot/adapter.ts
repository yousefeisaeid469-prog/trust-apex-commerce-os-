import type {DeploymentAdapter,DeploymentCandidate,DeploymentPhase} from './contracts.ts';

export class InMemoryDeploymentAdapter implements DeploymentAdapter {
  private state={phase:'PREFLIGHT' as DeploymentPhase,rolloutId:'',promoted:false,frozen:false,rolledBack:false};
  preflight(candidate:DeploymentCandidate){return Boolean(candidate.candidateHash&&candidate.version&&candidate.buildRef);}
  canary(candidate:DeploymentCandidate,rolloutId:string){if(!this.preflight(candidate))return false;this.state={...this.state,phase:'CANARY',rolloutId};return true;}
  promote(rolloutId:string){if(rolloutId!==this.state.rolloutId||this.state.frozen)return false;this.state={...this.state,phase:'COMPLETE',promoted:true};return true;}
  freeze(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'FREEZE',frozen:true};return true;}
  rollback(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'ROLLBACK',rolledBack:true,frozen:true,promoted:false};return true;}
  resume(rolloutId:string){if(rolloutId!==this.state.rolloutId)return false;this.state={...this.state,phase:'VERIFY',frozen:false};return true;}
  snapshot(){return {...this.state};}
}

export class FailClosedDeploymentAdapter implements DeploymentAdapter {
  preflight(){return false;} canary(){return false;} promote(){return false;} freeze(){return false;} rollback(){return false;} resume(){return false;}
  snapshot(){return {phase:'FAILED' as DeploymentPhase,rolloutId:'',promoted:false,frozen:true,rolledBack:false};}
}
