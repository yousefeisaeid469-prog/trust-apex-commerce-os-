export type RegionState='HEALTHY'|'DEGRADED'|'FAILED';
export type DeploymentStrategy='BLUE_GREEN'|'CANARY';
export type Region={id:string;priority:number;state:RegionState;capacityPct:number};
export type DeploymentPlan={strategy:DeploymentStrategy;regions:Region[];minHealthyRegions:number;rollbackOnFailure:boolean};
export function selectFailoverRegion(regions:Region[]):Region{const candidates=regions.filter(r=>r.state==='HEALTHY'&&r.capacityPct>0).sort((a,b)=>a.priority-b.priority||b.capacityPct-a.capacityPct);if(!candidates[0])throw new Error('NO_HEALTHY_REGION');return candidates[0];}
export function deploymentGate(input:{healthyRegions:number;minHealthyRegions:number;errorRate:number;p95Ms:number;maxErrorRate:number;maxP95Ms:number}):boolean{return input.healthyRegions>=input.minHealthyRegions&&input.errorRate<=input.maxErrorRate&&input.p95Ms<=input.maxP95Ms;}
export function restoreDrill(input:{backupChecksum:string;restoredChecksum:string;criticalRowsBefore:number;criticalRowsAfter:number}):{passed:boolean;reason:string}{const passed=!!input.backupChecksum&&input.backupChecksum===input.restoredChecksum&&input.criticalRowsBefore===input.criticalRowsAfter;return {passed,reason:passed?'RESTORE_MATCHED_CRITICAL_EVIDENCE':'RESTORE_EVIDENCE_MISMATCH'};}
