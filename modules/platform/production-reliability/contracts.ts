import type {ReliabilitySignal,RuntimeEnforcer,RuntimeState} from '../autonomous-reliability-loop/contracts';
import type {ReliabilityLoopResult} from '../autonomous-reliability-loop/loop';
export interface ProductionTelemetry { getReliabilitySignal(input:{serviceId:string;tenantId?:string;rolloutId?:string}):ReliabilitySignal; }
export interface ProductionIncidentStore { open(input:{incidentId:string;signal:ReliabilitySignal;severity:string}):void; transition(input:{incidentId:string;status:string;decision:string}):void; get(incidentId:string):{incidentId:string;status:string;decision?:string}|undefined; }
export interface ProductionRuntimeState extends RuntimeState { rolledBackRollouts:string[]; }
export interface ProductionReliabilityRuntime extends RuntimeEnforcer,ProductionTelemetry,ProductionIncidentStore { runtimeSnapshot():ProductionRuntimeState; }
export interface ProductionReliabilityCycleInput { incidentId:string; serviceId:string; tenantId?:string; rolloutId:string; result:import('../reliability-lab/engine').LabResult; blastRadius:{serviceIds:string[];tenantIds:string[];rolloutIds:string[]}; mitigationReason?:string; }
export interface ProductionReliabilityCycleResult { signal:ReliabilitySignal; loop:ReliabilityLoopResult; runtimeVerified:boolean; incident:{status:string;decision:string}; }
