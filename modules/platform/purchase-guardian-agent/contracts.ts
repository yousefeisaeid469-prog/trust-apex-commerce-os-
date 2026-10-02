export type GuardianActionType='review_return'|'review_warranty'|'review_delivery'|'resolve_attention';
export type GuardianActionRisk='low'|'medium'|'high';
export type GuardianActionStatus='PROPOSED'|'APPROVAL_REQUIRED'|'APPROVED'|'EXECUTED'|'FAILED';
export type GuardianAction={id:string;customerId:string;orderId:string;type:GuardianActionType;risk:GuardianActionRisk;confidence:number;reversible:boolean;status:GuardianActionStatus;reason:string;createdAt:string};
export type GuardianPlan={customerId:string;actions:GuardianAction[];policyVersion:'183.1'};
