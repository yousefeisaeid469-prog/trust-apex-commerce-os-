export type SupportPriority='LOW'|'NORMAL'|'HIGH'|'URGENT';
export interface SupportCase{caseId:string;customerId:string;orderId?:string;category:'ORDER'|'DELIVERY'|'RETURN'|'PAYMENT'|'PRODUCT'|'ACCOUNT'|'OTHER';priority:SupportPriority;message:string;createdAt:string;}
export interface SupportAction{action:'TRACK'|'EXPLAIN_RETURN'|'START_RETURN'|'ESCALATE'|'UPDATE_ORDER'|'HANDOFF';requiresApproval:boolean;reason:string;}
