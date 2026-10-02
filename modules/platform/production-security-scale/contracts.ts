export type AuthSurface = 'PUBLIC' | 'USER' | 'MERCHANT' | 'ADMIN' | 'PERMISSION' | 'WEBHOOK' | 'UNKNOWN';
export type AuthAuditStatus = 'PASS' | 'WARN' | 'FAIL';
export type AuthRouteAudit = { route:string; methods:string[]; surface:AuthSurface; status:AuthAuditStatus; evidence:string };
export type ScaleControl = { id:string; status:'PASS'|'WARN'|'FAIL'; detail:string };
export type ProductionSecurityScaleReport = { version:'V222.0.0'; generatedAt:string; ready:boolean; score:number; auth:AuthRouteAudit[]; controls:ScaleControl[]; blockers:string[]; warnings:string[] };
