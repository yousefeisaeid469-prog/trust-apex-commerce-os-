export type AgentId = 'pricing' | 'inventory' | 'customer' | 'growth' | 'risk' | 'logistics';
export type AgentMode = 'observe' | 'recommend' | 'simulate' | 'execute';
export type AgentRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentSignal { id:string; domain:string; metric:string; value:number; unit?:string; }
export interface AgentDecision { id:string; agentId:AgentId; title:string; rationale:string; risk:AgentRisk; confidence:number; mode:AgentMode; requiresApproval:boolean; }
export interface AgentDefinition { id:AgentId; name:string; mission:string; allowedModes:AgentMode[]; defaultRisk:AgentRisk; }
