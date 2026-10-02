export type ReliabilityAction =
  | 'OPEN_INCIDENT'
  | 'FREEZE_ROLLOUT'
  | 'ISOLATE_SERVICE'
  | 'ISOLATE_TENANT'
  | 'MITIGATE'
  | 'ROLLBACK'
  | 'RESUME_ROLLOUT'
  | 'ESCALATE';

export type LoopDecision = 'RESUME'|'ROLLBACK'|'ESCALATE'|'MITIGATE_AND_VERIFY';
export type IncidentSeverity = 'SEV1'|'SEV2'|'SEV3';

export interface ReliabilitySignal {
  serviceId:string;
  tenantId?:string;
  rolloutId?:string;
  availability:number;
  errorRate:number;
  p95Ms:number;
  budgetConsumedPct:number;
  failureHash?:string;
  replayMatches:boolean;
  newFailure:boolean;
}

export interface BlastRadius {
  serviceIds:string[];
  tenantIds:string[];
  rolloutIds:string[];
}

export interface RuntimeState {
  incidents:string[];
  frozenRollouts:string[];
  isolatedServices:string[];
  isolatedTenants:string[];
  mitigations:string[];
  rollbacks:string[];
  escalations:string[];
}

export interface EnforcementReceipt {
  action:ReliabilityAction;
  target:string;
  accepted:boolean;
  reason:string;
  at:string;
}

export interface ReliabilityLearner { record(input:{failureHash?:string;decision:string;status:string;reasons:string[];occurrence:number;policyRevision:string}):{learningHash:string;accepted:true}; }

export interface RuntimeEnforcer {
  snapshot():RuntimeState;
  openIncident(incidentId:string,severity:IncidentSeverity,signal:ReliabilitySignal):EnforcementReceipt;
  freezeRollout(rolloutId:string):EnforcementReceipt;
  isolateService(serviceId:string):EnforcementReceipt;
  isolateTenant(tenantId:string):EnforcementReceipt;
  mitigate(serviceId:string,reason:string):EnforcementReceipt;
  rollback(rolloutId:string):EnforcementReceipt;
  resumeRollout(rolloutId:string):EnforcementReceipt;
  escalate(incidentId:string,reason:string):EnforcementReceipt;
}
