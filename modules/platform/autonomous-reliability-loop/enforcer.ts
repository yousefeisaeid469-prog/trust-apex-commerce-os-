import type {EnforcementReceipt,IncidentSeverity,ReliabilitySignal,RuntimeEnforcer,RuntimeState} from './contracts.ts';

function receipt(action:EnforcementReceipt['action'],target:string,accepted=true,reason='APPLIED'):EnforcementReceipt{
  return {action,target,accepted,reason,at:new Date().toISOString()};
}

export class InMemoryRuntimeEnforcer implements RuntimeEnforcer {
  private state:RuntimeState={incidents:[],frozenRollouts:[],isolatedServices:[],isolatedTenants:[],mitigations:[],rollbacks:[],escalations:[]};
  snapshot(){return JSON.parse(JSON.stringify(this.state)) as RuntimeState;}
  openIncident(id:string,_severity:IncidentSeverity,_signal:ReliabilitySignal){if(!this.state.incidents.includes(id))this.state.incidents.push(id);return receipt('OPEN_INCIDENT',id);}
  freezeRollout(id:string){if(!this.state.frozenRollouts.includes(id))this.state.frozenRollouts.push(id);return receipt('FREEZE_ROLLOUT',id);}
  isolateService(id:string){if(!this.state.isolatedServices.includes(id))this.state.isolatedServices.push(id);return receipt('ISOLATE_SERVICE',id);}
  isolateTenant(id:string){if(!this.state.isolatedTenants.includes(id))this.state.isolatedTenants.push(id);return receipt('ISOLATE_TENANT',id);}
  mitigate(id:string,reason:string){this.state.mitigations.push(`${id}:${reason}`);return receipt('MITIGATE',id);}
  rollback(id:string){if(!this.state.rollbacks.includes(id))this.state.rollbacks.push(id);return receipt('ROLLBACK',id);}
  resumeRollout(id:string){this.state.frozenRollouts=this.state.frozenRollouts.filter(x=>x!==id);return receipt('RESUME_ROLLOUT',id);}
  escalate(id:string,reason:string){this.state.escalations.push(`${id}:${reason}`);return receipt('ESCALATE',id);}
}

export class FailClosedRuntimeEnforcer implements RuntimeEnforcer {
  private readonly reason:string;
  constructor(reason='NO_LIVE_RUNTIME_ADAPTER'){this.reason=reason;}
  snapshot(){return {incidents:[],frozenRollouts:[],isolatedServices:[],isolatedTenants:[],mitigations:[],rollbacks:[],escalations:[]};}
  private reject(action:EnforcementReceipt['action'],target:string){return receipt(action,target,false,this.reason);}
  openIncident(id:string){return this.reject('OPEN_INCIDENT',id);} freezeRollout(id:string){return this.reject('FREEZE_ROLLOUT',id);} isolateService(id:string){return this.reject('ISOLATE_SERVICE',id);} isolateTenant(id:string){return this.reject('ISOLATE_TENANT',id);} mitigate(id:string){return this.reject('MITIGATE',id);} rollback(id:string){return this.reject('ROLLBACK',id);} resumeRollout(id:string){return this.reject('RESUME_ROLLOUT',id);} escalate(id:string){return this.reject('ESCALATE',id);}
}
