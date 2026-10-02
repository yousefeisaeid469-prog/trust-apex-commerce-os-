export type AiSignal = { id:string; label:string; value:number|string; confidence:number; source:string; domain:'shopping'|'customer'|'merchant'|'platform'; };
export type AiAction = { id:string; title:string; rationale:string; confidence:number; risk:'LOW'|'MEDIUM'|'HIGH'; requiresApproval:boolean; target:string; };
export type AiExperienceSnapshot = { version:'2.0'; mode:'DECISION_SUPPORT'; signals:AiSignal[]; actions:AiAction[]; guardrails:string[]; unavailable:string[]; };
