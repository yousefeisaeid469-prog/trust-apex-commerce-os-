export type ReadinessDomain = 'SECURITY' | 'DATA_PROTECTION' | 'FINANCIAL_SAFETY' | 'DOCUMENTATION' | 'SCALABILITY' | 'PERFORMANCE';
export type ReadinessStatus = 'PASS' | 'WARN' | 'FAIL';
export interface ReadinessCheck { id:string; domain:ReadinessDomain; status:ReadinessStatus; title:string; detail:string; evidence?:string; }
export interface ProductionReadinessReport { version:string; generatedAt:string; ready:boolean; score:number; checks:ReadinessCheck[]; blockers:string[]; warnings:string[]; }
