import type { ReturnReasonCode, ReturnItemCondition } from '../returns/contracts';
import { decideResolution, canResolveWithoutOperator, type ResolutionContext } from './resolution-policy';

export type ResolutionScenario = {
  id: string;
  title: string;
  reason: ReturnReasonCode;
  condition: ReturnItemCondition;
  recoverable: boolean;
  restockable: boolean;
  requestedAmount: number;
  expectedRecommendation: 'REFUND'|'REPLACEMENT'|'STORE_CREDIT'|'REJECTED'|'NO_ACTION';
  requiresOperator: boolean;
};

export const RESOLUTION_SCENARIOS: readonly ResolutionScenario[] = [
  { id:'wrong-item-sealed', title:'Wrong item sealed', reason:'WRONG_ITEM', condition:'SEALED', recoverable:true, restockable:true, requestedAmount:900, expectedRecommendation:'REPLACEMENT', requiresOperator:false },
  { id:'wrong-item-opened', title:'Wrong item opened', reason:'WRONG_ITEM', condition:'OPENED', recoverable:true, restockable:true, requestedAmount:900, expectedRecommendation:'REPLACEMENT', requiresOperator:false },
  { id:'wrong-item-used', title:'Wrong item used', reason:'WRONG_ITEM', condition:'USED', recoverable:true, restockable:false, requestedAmount:900, expectedRecommendation:'REFUND', requiresOperator:false },
  { id:'damaged-restockable', title:'Damaged but restockable', reason:'DAMAGED', condition:'OPENED', recoverable:true, restockable:true, requestedAmount:1200, expectedRecommendation:'REFUND', requiresOperator:false },
  { id:'damaged-not-recoverable', title:'Damaged beyond recovery', reason:'DAMAGED', condition:'DAMAGED', recoverable:false, restockable:false, requestedAmount:1200, expectedRecommendation:'REFUND', requiresOperator:false },
  { id:'defective', title:'Defective item', reason:'DEFECTIVE', condition:'DEFECTIVE', recoverable:true, restockable:false, requestedAmount:1800, expectedRecommendation:'REFUND', requiresOperator:false },
  { id:'not-described', title:'Not as described', reason:'NOT_AS_DESCRIBED', condition:'OPENED', recoverable:true, restockable:true, requestedAmount:1500, expectedRecommendation:'REFUND', requiresOperator:false },
  { id:'size-fit', title:'Size or fit', reason:'SIZE_OR_FIT', condition:'SEALED', recoverable:true, restockable:true, requestedAmount:700, expectedRecommendation:'REFUND', requiresOperator:false },
  { id:'changed-mind', title:'Changed mind', reason:'CHANGED_MIND', condition:'SEALED', recoverable:true, restockable:true, requestedAmount:700, expectedRecommendation:'STORE_CREDIT', requiresOperator:false },
  { id:'late-delivery', title:'Late delivery', reason:'LATE_DELIVERY', condition:'SEALED', recoverable:true, restockable:true, requestedAmount:500, expectedRecommendation:'STORE_CREDIT', requiresOperator:false },
  { id:'other', title:'Other reason', reason:'OTHER', condition:'OPENED', recoverable:true, restockable:true, requestedAmount:500, expectedRecommendation:'REFUND', requiresOperator:true },
  { id:'unknown-condition', title:'Unknown condition', reason:'DAMAGED', condition:'UNKNOWN', recoverable:true, restockable:true, requestedAmount:500, expectedRecommendation:'NO_ACTION', requiresOperator:true },
];

function contextFor(scenario: ResolutionScenario): ResolutionContext {
  return { reason:scenario.reason, condition:scenario.condition, recoverable:scenario.recoverable, restockable:scenario.restockable, requestedAmount:scenario.requestedAmount, shippingAmount:0 };
}

export function evaluateScenario(scenario: ResolutionScenario) {
  const decision=decideResolution(contextFor(scenario));
  return { id:scenario.id, recommendation:decision.recommended, matchesExpected:decision.recommended===scenario.expectedRecommendation, canAutoResolve:canResolveWithoutOperator(contextFor(scenario),decision), allowed:decision.allowed, blocked:decision.blocked, recoveryDisposition:decision.recoveryDisposition };
}

export function evaluateScenarioSet(scenarios: readonly ResolutionScenario[] = RESOLUTION_SCENARIOS) {
  const results=scenarios.map(evaluateScenario);
  const mismatches=results.filter((r,i)=>!r.matchesExpected || r.canAutoResolve === scenarios[i].requiresOperator);
  return { total:results.length, passed:results.length-mismatches.length, failed:mismatches.length, results, healthy:mismatches.length===0 };
}

export function scenarioById(id: string) { return RESOLUTION_SCENARIOS.find(s=>s.id===id); }
export function scenarioRequiresOperator(id: string) { const s=scenarioById(id); if(!s)throw new Error('SCENARIO_NOT_FOUND'); return s.requiresOperator; }
export function scenarioRecommendation(id: string) { const s=scenarioById(id); if(!s)throw new Error('SCENARIO_NOT_FOUND'); return evaluateScenario(s).recommendation; }
export function scenarioRecoveryDisposition(id: string) { const s=scenarioById(id); if(!s)throw new Error('SCENARIO_NOT_FOUND'); return evaluateScenario(s).recoveryDisposition; }
export function scenarioIsHealthy(id: string) { const s=scenarioById(id); if(!s)throw new Error('SCENARIO_NOT_FOUND'); const result=evaluateScenario(s); return result.matchesExpected && result.canAutoResolve !== s.requiresOperator; }
export function scenarioSummary() { const report=evaluateScenarioSet(); return { total:report.total,passed:report.passed,failed:report.failed,healthy:report.healthy,operatorCases:RESOLUTION_SCENARIOS.filter(s=>s.requiresOperator).length,automatableCases:RESOLUTION_SCENARIOS.filter(s=>!s.requiresOperator).length }; }
