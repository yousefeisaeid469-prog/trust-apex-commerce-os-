export type ExecutionStatus='READY'|'BLOCKED'|'EXECUTED'|'DUPLICATE'|'ROLLED_BACK';
export type ExecutionAction='PRICE'|'SUPPLY'|'FULFILLMENT'|'FINANCE'|'SUPPORT'|'TRUST'|'GENERIC';
export interface ExecutionPolicy{allowedActions?:ExecutionAction[];maxRiskBps:number;maxBudgetMinor?:bigint;requireApprovalAboveRiskBps?:number;requireApprovalForActions?:ExecutionAction[];}
export interface ExecutionCommand{commandId:string;tenantId:string;decisionId:string;action:ExecutionAction;riskBps:number;budgetMinor?:bigint;payload:Record<string,string|number|boolean>;requiresApproval?:boolean;createdAt:number;}
export interface ExecutionReceipt{receiptId:string;commandId:string;tenantId:string;decisionId:string;status:ExecutionStatus;action:ExecutionAction;rollbackToken?:string;executedAt:number;reason:string;}
export interface RollbackResult{commandId:string;tenantId:string;status:'ROLLED_BACK'|'NOT_ROLLBACKABLE'|'NOT_FOUND';at:number;reason:string;}
export interface ExecutionPlan{commandId:string;tenantId:string;decisionId:string;status:'READY'|'BLOCKED';action:ExecutionAction;riskBps:number;budgetMinor?:bigint;requiresApproval:boolean;reason:string;}
