import type {IncidentSeverity,ReliabilitySignal,EnforcementReceipt,RuntimeState} from '../autonomous-reliability-loop/contracts.ts';
import {InMemoryRuntimeEnforcer} from '../autonomous-reliability-loop/enforcer.ts';
import type {ProductionReliabilityRuntime,ProductionRuntimeState} from './contracts.ts';
export class InMemoryProductionReliabilityRuntime extends InMemoryRuntimeEnforcer implements ProductionReliabilityRuntime {
  private signal:ReliabilitySignal={serviceId:'unknown',availability:1,errorRate:0,p95Ms:1,budgetConsumedPct:0,replayMatches:true,newFailure:false};
  private incidents=new Map<string,{incidentId:string;status:string;decision?:string}>(); private rolledBackRollouts:string[]=[];
  setSignal(signal:ReliabilitySignal){this.signal={...signal};}
  getReliabilitySignal(){return {...this.signal};}
  freezeRollout(id:string):EnforcementReceipt{return super.freezeRollout(id);}
  rollback(id:string):EnforcementReceipt{const receipt=super.rollback(id);if(!this.rolledBackRollouts.includes(id))this.rolledBackRollouts.push(id);return receipt;}
  resumeRollout(id:string):EnforcementReceipt{return super.resumeRollout(id);}
  snapshot():ProductionRuntimeState{return {...super.snapshot(),rolledBackRollouts:[...this.rolledBackRollouts]};}
  open(input:{incidentId:string;signal:ReliabilitySignal;severity:string}){this.incidents.set(input.incidentId,{incidentId:input.incidentId,status:'OPEN'});}
  transition(input:{incidentId:string;status:string;decision:string}){const cur=this.incidents.get(input.incidentId)||{incidentId:input.incidentId,status:'OPEN'};this.incidents.set(input.incidentId,{...cur,status:input.status,decision:input.decision});}
  get(id:string){return this.incidents.get(id);}
  runtimeSnapshot():ProductionRuntimeState{return this.snapshot();}
  openIncident(id:string,severity:IncidentSeverity,signal:ReliabilitySignal):EnforcementReceipt{this.open({incidentId:id,signal,severity});return super.openIncident(id,severity,signal);}
}
