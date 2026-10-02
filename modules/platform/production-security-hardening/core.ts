import type { HardeningControl, ProductionSecurityHardeningReport } from './contracts';

export function buildSecurityHardeningReport(input:{controls?:HardeningControl[]; now?:string}={}):ProductionSecurityHardeningReport {
  const controls=input.controls??[];
  const blockers=controls.filter(c=>c.status==='FAIL').map(c=>`${c.id}: ${c.detail}`);
  const warnings=controls.filter(c=>c.status==='WARN').map(c=>`${c.id}: ${c.detail}`);
  const score=controls.length?Math.round(controls.reduce((n,c)=>n+(c.status==='PASS'?100:c.status==='WARN'?60:0),0)/controls.length):100;
  return {version:'V224.0.0',generatedAt:input.now??new Date().toISOString(),ready:blockers.length===0,score,controls,blockers,warnings};
}

export function optimizeOrderCancelQueryPlan(){
  return {indexes:[
    'idx_trust_inventory_reservations_order_status on trust_inventory_reservations(order_id,status)',
    'idx_trust_inventory_ledger_product_reference on trust_inventory_ledger(product_id,reference_id)'
  ],strategy:'lock order once, fetch only cancellable reservations, release rows in one set-based update, then journal each released line'};
}
