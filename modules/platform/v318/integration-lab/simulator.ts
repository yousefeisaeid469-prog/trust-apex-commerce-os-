import {createHash} from 'node:crypto';
import type {IntegrationState,OrderRow} from './contracts.ts';

export function newState(initialStock:number):IntegrationState{return {inventory:new Map([['SKU-1',{sku:'SKU-1',available:initialStock,reserved:0}]]),orders:new Map(),processedKeys:new Set(),ledger:0n};}
export function cloneState(s:IntegrationState):IntegrationState{return {inventory:new Map([...s.inventory].map(([k,v])=>[k,{...v}])),orders:new Map([...s.orders].map(([k,v])=>[k,{...v}])),processedKeys:new Set(s.processedKeys),ledger:s.ledger};}
export function executeOnce(s:IntegrationState,key:string,qty:number,totalMinor:bigint,failAt?:'PAYMENT'|'FULFILLMENT'):OrderRow{
  if(s.processedKeys.has(key)){const old=s.orders.get(key);if(!old)throw new Error('IDEMPOTENCY_STATE_CORRUPT');return old;}
  const before=cloneState(s); const stock=s.inventory.get('SKU-1');
  if(!stock||stock.available<qty)throw new Error('INSUFFICIENT_STOCK');
  try{
    stock.available-=qty; stock.reserved+=qty;
    if(failAt==='PAYMENT')throw new Error('INJECTED_FAILURE:PAYMENT');
    const order:OrderRow={id:`ord_${hash(key)}`,status:'PAID',quantity:qty,totalMinor};
    s.orders.set(key,order); s.ledger+=totalMinor;
    if(failAt==='FULFILLMENT')throw new Error('INJECTED_FAILURE:FULFILLMENT');
    stock.reserved-=qty; order.status='FULFILLED'; s.processedKeys.add(key); return order;
  }catch(e){s.inventory=before.inventory;s.orders=before.orders;s.processedKeys=before.processedKeys;s.ledger=before.ledger;throw e;}
}
export function hash(value:string){return createHash('sha256').update(value).digest('hex').slice(0,16)}
export function stateFingerprint(s:IntegrationState){return JSON.stringify({inventory:[...s.inventory].sort(),orders:[...s.orders].map(([k,v])=>[k,{...v,totalMinor:v.totalMinor.toString()}]).sort(),processed:[...s.processedKeys].sort(),ledger:s.ledger.toString()});}
