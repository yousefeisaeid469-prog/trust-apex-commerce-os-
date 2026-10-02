import {createHash} from 'node:crypto';
import type {MarketplaceExecutionCommand,V317Stage,V317Status} from './contracts.ts';
export const STAGES:V317Stage[]=['TENANT','SELLER','CATALOG','INVENTORY','ORDER','PAYMENT','FULFILLMENT','FINANCE','ANALYTICS'];
export function validateExecutionCommand(c:MarketplaceExecutionCommand){
  for(const key of ['tenantId','sellerId','productId','offerId','customerId','idempotencyKey'] as const) if(!String(c[key]??'').trim()) throw new Error('V317_ID_REQUIRED');
  if(!Number.isSafeInteger(c.quantity)||c.quantity<=0) throw new Error('V317_QUANTITY_INVALID');
  if(c.unitPriceMinor<=0n||c.shippingMinor<0n) throw new Error('V317_MONEY_INVALID');
  if(!/^[A-Z]{3}$/.test(c.currency)) throw new Error('V317_CURRENCY_INVALID');
  if(!Number.isInteger(c.commissionBps)||c.commissionBps<0||c.commissionBps>10000) throw new Error('V317_COMMISSION_INVALID');
}
export function calculate(c:MarketplaceExecutionCommand,fulfillmentFeeMinor=c.shippingMinor){
  validateExecutionCommand(c);
  const subtotalMinor=c.unitPriceMinor*BigInt(c.quantity), totalMinor=subtotalMinor+c.shippingMinor;
  const commissionMinor=subtotalMinor*BigInt(c.commissionBps)/10000n;
  const sellerNetMinor=subtotalMinor-commissionMinor;
  if(commissionMinor+sellerNetMinor+fulfillmentFeeMinor!==totalMinor) throw new Error('V317_SETTLEMENT_IMBALANCE');
  return {subtotalMinor,shippingMinor:c.shippingMinor,totalMinor,commissionMinor,fulfillmentFeeMinor,sellerNetMinor};
}
export function workflowId(c:MarketplaceExecutionCommand){
  validateExecutionCommand(c);
  const canonical=[c.tenantId,c.sellerId,c.productId,c.offerId,c.customerId,c.quantity,c.unitPriceMinor.toString(),c.shippingMinor.toString(),c.currency,c.commissionBps,c.idempotencyKey,c.destinationRegion??'GLOBAL'].join('|');
  return `v317_${createHash('sha256').update(canonical).digest('hex').slice(0,32)}`;
}
export function stageStatusMap(status:'COMPLETED'|'FAILED'|'RUNNING'='RUNNING'){return Object.fromEntries(STAGES.map(s=>[s,status])) as Record<V317Stage,V317Status>}
