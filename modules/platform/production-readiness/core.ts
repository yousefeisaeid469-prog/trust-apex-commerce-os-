import { assessProductionSecurity } from '../security/production-posture.ts';
import type { ProductionReadinessReport, ReadinessCheck } from './contracts';

export function buildProductionReadinessReport(input: { sourceAudit?: ReadinessCheck[]; documentation?: ReadinessCheck[]; scalability?: ReadinessCheck[]; performance?: ReadinessCheck[]; financial?: ReadinessCheck[]; now?:string } = {}): ProductionReadinessReport {
  const security = assessProductionSecurity();
  const checks: ReadinessCheck[] = [
    ...security.checks.map(c => ({ id:c.id, domain:'SECURITY' as const, status:c.status, title:c.id, detail:c.detail })),
    ...(input.sourceAudit ?? []), ...(input.documentation ?? []), ...(input.scalability ?? []), ...(input.performance ?? []), ...(input.financial ?? []),
  ];
  const blockers = checks.filter(c=>c.status==='FAIL').map(c=>`${c.id}: ${c.detail}`);
  const warnings = checks.filter(c=>c.status==='WARN').map(c=>`${c.id}: ${c.detail}`);
  const score = checks.length ? Math.round(checks.reduce((n,c)=>n+(c.status==='PASS'?100:c.status==='WARN'?60:0),0)/checks.length) : 0;
  return { version:'V222.0.0', generatedAt:input.now ?? new Date().toISOString(), ready:blockers.length===0, score, checks, blockers, warnings };
}
