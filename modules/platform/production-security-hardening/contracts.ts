export type HardeningStatus = 'PASS' | 'WARN' | 'FAIL';
export type ControlDomain = 'AUTH' | 'RATE_LIMIT' | 'DATABASE' | 'DEPENDENCY' | 'SECRETS' | 'CSP' | 'CI';
export type HardeningControl = { id:string; domain:ControlDomain; status:HardeningStatus; title:string; detail:string; evidence?:string };
export type ProductionSecurityHardeningReport = { version:'V224.0.0'; generatedAt:string; ready:boolean; score:number; controls:HardeningControl[]; blockers:string[]; warnings:string[] };
