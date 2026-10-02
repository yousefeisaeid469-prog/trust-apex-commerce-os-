import { createHash } from 'node:crypto';
import type { ChaosScenario } from './scenarios.ts';
export type FaultPlan={id:string;version:number;scenarios:ChaosScenario[]};
export function fingerprintPlan(plan:FaultPlan){ if(!plan.id||plan.version<1) throw new Error('FAULT_PLAN_INVALID'); const canonical={id:plan.id,version:plan.version,scenarios:[...plan.scenarios].sort((a,b)=>a.id.localeCompare(b.id))}; return createHash('sha256').update(JSON.stringify(canonical)).digest('hex'); }
