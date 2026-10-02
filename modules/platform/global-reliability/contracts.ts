// V225 recovery contract: RTO, RPO, FAILOVER, RESTORE, DRILL are evidence-bound controls.
export type RegionState='HEALTHY'|'DEGRADED'|'OUTAGE'|'EVACUATING'|'EVACUATED'|'UNKNOWN';
export type RecoveryAction='FAILOVER'|'RESTORE'|'REPLAY'|'EVACUATE_REGION'|'REOPEN_REGION'|'DRILL';
export type RecoveryStatus='READY'|'BLOCKED'|'IN_PROGRESS'|'RECOVERED'|'FAILED';
export type EvidenceStatus='VERIFIED'|'MISSING'|'STALE'|'FAILED';
export interface RegionRecord {region:string; state:RegionState; trafficPct:number; capacityPct:number; errorRate:number; latencyP95Ms:number; lastHealthyAt?:string;}
export interface RecoveryObjective {service:string; rtoMinutes:number; rpoMinutes:number; evidenceStatus:EvidenceStatus; lastDrillAt?:string;}
export interface BackupEvidence {id:string; region:string; createdAt:string; verifiedAt?:string; restoreTestedAt?:string; status:EvidenceStatus; ageMinutes:number;}
export interface RecoveryDrill {id:string; region:string; action:RecoveryAction; status:RecoveryStatus; startedAt:string; completedAt?:string; notes?:string;}
export interface RecoveryPlan {action:RecoveryAction; region:string; status:RecoveryStatus; reason:string; estimatedRtoMinutes:number; estimatedRpoMinutes:number; requiresApproval:boolean;}
export interface GlobalReliabilityReport {version:string; generatedAt:string; activeRegion:string; regions:RegionRecord[]; objectives:RecoveryObjective[]; backups:BackupEvidence[]; drills:RecoveryDrill[]; plans:RecoveryPlan[]; blockers:string[]; warnings:string[]; score:number; ready:boolean;}
