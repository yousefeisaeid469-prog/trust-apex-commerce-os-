export type DecisionMode='RECOMMEND'|'APPROVAL_REQUIRED'|'AUTO_EXECUTE';
export type DecisionStatus='DECIDED'|'APPROVAL_REQUIRED'|'NO_DECISION';
export interface DecisionPolicy{maxRiskBps:number;minConfidenceBps:number;minSupportBps:number;maxBudgetMinor?:bigint;allowedActions?:string[];blockedActions?:string[];}
export interface DecisionSignal{signalId:string;tenantId:string;kind:string;strengthBps:number;createdAt:number;}
export interface DecisionCandidate{candidateId:string;tenantId:string;proposalId:string;agentId:string;role:string;action:string;confidenceBps:number;riskBps:number;expectedImpactBps:number;priority:number;reason:string;signalIds:string[];requiresApproval:boolean;}
export interface ChiefDecision{decisionId:string;tenantId:string;taskId:string;status:DecisionStatus;mode:DecisionMode;action?:string;selectedProposalIds:string[];supportBps:number;confidenceBps:number;riskBps:number;expectedImpactBps:number;approvalRequired:boolean;reason:string;createdAt:number;}
export interface DecisionAudit{decisionId:string;tenantId:string;event:'CREATED'|'APPROVED'|'REJECTED'|'EXECUTED';actor:string;at:number;metadata?:Record<string,string>;}
