export type AutonomyLevel='SUGGEST'|'APPROVAL_REQUIRED'|'AUTO_EXECUTE';
export type ActionKind='REBALANCE_INVENTORY'|'REROUTE_FULFILLMENT'|'REPLENISH_SUPPLY'|'PAUSE_SUPPLIER'|'OPTIMIZE_PROMOTION'|'ADJUST_PRICE'|'HOLD_PAYOUT'|'OPEN_REVIEW';
export interface DecisionContext{tenantId:string;signalIds:string[];domains:string[];riskBps:number;expectedImpactBps:number;confidenceBps:number;budgetMinor?:bigint;currency?:string;}
export interface DecisionPolicy{id:string;tenantId:string;action:ActionKind;maxRiskBps:number;minConfidenceBps:number;maxBudgetMinor?:bigint;autonomy:AutonomyLevel;enabled:boolean;}
export interface ActionProposal{proposalId:string;tenantId:string;action:ActionKind;priority:number;confidenceBps:number;riskBps:number;expectedImpactBps:number;requiresApproval:boolean;reason:string;policyId:string;signalIds:string[];idempotencyKey:string;}
export interface DecisionPlan{planId:string;tenantId:string;proposals:ActionProposal[];totalExpectedImpactBps:number;maxRiskBps:number;requiresApproval:boolean;}
export interface SimulationResult{proposalId:string;baselineScore:number;projectedScore:number;delta:number;assumptions:string[];}
export interface ExecutionReceipt{proposalId:string;status:'EXECUTED'|'PENDING_APPROVAL'|'REJECTED'|'DUPLICATE';executedAt:number;rollbackToken?:string;}
