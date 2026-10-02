import { createHash } from 'node:crypto';
import type {MarketplaceCommand,MarketplaceRun,MarketplaceStep,Money} from './contracts.ts';

const id=(s:string)=>String(s??'').trim();
const money=(amountMinor:bigint,currency:string):Money=>({amountMinor,currency:currency.toUpperCase()});
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value,(k,v)=>typeof v==='bigint'?`${v}n`:v)).digest('hex');

export function validateCommand(c:MarketplaceCommand){
  if(!id(c.tenantId)||!id(c.sellerId)||!id(c.productId)||!id(c.offerId)||!id(c.customerId)) throw new Error('MARKETPLACE_ID_REQUIRED');
  if(!Number.isSafeInteger(c.quantity)||c.quantity<=0) throw new Error('MARKETPLACE_QUANTITY_INVALID');
  if(c.unitPriceMinor<0n||c.shippingMinor<0n) throw new Error('MARKETPLACE_MONEY_INVALID');
  if(!/^[A-Z]{3}$/.test(c.currency)) throw new Error('MARKETPLACE_CURRENCY_INVALID');
  if(!Number.isInteger(c.commissionBps)||c.commissionBps<0||c.commissionBps>10000) throw new Error('MARKETPLACE_COMMISSION_INVALID');
  if(!id(c.idempotencyKey)) throw new Error('MARKETPLACE_IDEMPOTENCY_REQUIRED');
}

export function planMarketplaceRun(c:MarketplaceCommand):MarketplaceRun{
  validateCommand(c);
  const subtotalMinor=c.unitPriceMinor*BigInt(c.quantity);
  const totalMinor=subtotalMinor+c.shippingMinor;
  const commissionMinor=(subtotalMinor*BigInt(c.commissionBps))/10000n;
  const sellerNetMinor=subtotalMinor-commissionMinor;
  const refs={tenant:c.tenantId,seller:c.sellerId,product:c.productId,offer:c.offerId,customer:c.customerId};
  const steps:MarketplaceStep[]=[
    {stage:'TENANT',status:'READY',reference:c.tenantId},
    {stage:'SELLER',status:'READY',reference:c.sellerId},
    {stage:'CATALOG',status:'READY',reference:c.productId},
    {stage:'INVENTORY',status:'READY',reference:c.offerId},
    {stage:'ORDER',status:'READY'},
    {stage:'PAYMENT',status:'READY'},
    {stage:'FULFILLMENT',status:'READY'},
    {stage:'FINANCE',status:'READY'},
    {stage:'ANALYTICS',status:'READY'}
  ];
  const fingerprint=hash({...refs,quantity:c.quantity,unitPriceMinor:c.unitPriceMinor,shippingMinor:c.shippingMinor,currency:c.currency,commissionBps:c.commissionBps,idempotencyKey:c.idempotencyKey});
  return {workflowId:`mkt_${fingerprint.slice(0,24)}`,status:'READY',steps,
    subtotal:money(subtotalMinor,c.currency),shipping:money(c.shippingMinor,c.currency),
    commission:money(commissionMinor,c.currency),sellerNet:money(sellerNetMinor,c.currency),total:money(totalMinor,c.currency),fingerprint};
}

export function transition(run:MarketplaceRun,stage:MarketplaceStep['stage'],status:MarketplaceStep['status'],reason?:string){
  const index=run.steps.findIndex(s=>s.stage===stage); if(index<0) throw new Error('MARKETPLACE_STAGE_UNKNOWN');
  run.steps[index]={...run.steps[index],status,...(reason?{reason}:{} )};
  run.status=run.steps.some(s=>s.status==='BLOCKED')?'BLOCKED':run.steps.every(s=>s.status==='COMPLETED')?'COMPLETED':'READY';
  return run;
}
