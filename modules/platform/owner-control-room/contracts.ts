export type OwnerControlRisk='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type OwnerControlId='SYSTEM_HEALTH'|'GLOBAL_RELIABILITY'|'REVENUE'|'COMMERCE'|'AI_AUTONOMY'|'SECURITY_FRAUD'|'PROVIDERS'|'MAINTENANCE_MODE'|'GLOBAL_FREEZE'|'AUTONOMY_KILL_SWITCH';
export type OwnerAuditResult='SIMULATED'|'ACCEPTED'|'BLOCKED'|'FAILED';
export interface OwnerControl { id:OwnerControlId; title:string; description:string; risk:OwnerControlRisk; requiresApproval:boolean; readOnly:boolean; }
export interface OwnerAuditEvent { eventId:string; actorEmail:string; action:string; target:string; result:OwnerAuditResult; requestId:string; payloadHash:string; previousHash:string|null; eventHash:string; createdAt:string; }
export interface OwnerControlRoomSnapshot { ownerEmail:string; controls:OwnerControl[]; audit:OwnerAuditEvent[]; controlMode:string; generatedAt:string; }
