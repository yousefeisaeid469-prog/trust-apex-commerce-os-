export type IncidentSeverity='SEV0'|'SEV1'|'SEV2'|'SEV3';
export type Incident={id:string;severity:IncidentSeverity;status:'OPEN'|'MITIGATING'|'RESOLVED';startedAt:string;resolvedAt?:string};
const order:Record<IncidentSeverity,number>={SEV0:0,SEV1:1,SEV2:2,SEV3:3};
export function requiresExecutiveEscalation(severity:IncidentSeverity){return order[severity]<=1;}
export function resolveIncident(i:Incident,resolvedAt=new Date().toISOString()):Incident{if(i.status==='RESOLVED')return i;return {...i,status:'RESOLVED',resolvedAt};}
