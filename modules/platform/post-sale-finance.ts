import type { SqlExecutor } from './persistence/postgres-boundary';
import { returnInventoryTransactionTx } from '../commerce/inventory/transaction-engine';

function money(v:number){if(!Number.isFinite(v)||v<=0)throw new Error('INVALID_POST_SALE_AMOUNT');return Math.round(v*100)/100;}

export async function recordPostSaleFinancialEventTx(tx:SqlExecutor,input:{eventType:'REFUND'|'SELLER_REFUND_REVERSAL'|'PAYOUT_REVERSAL'|'CHARGEBACK';amount:number;currency:string;idempotencyKey:string;returnId?:string|null;paymentId?:string|null;refundId?:string|null;payoutId?:string|null;merchantId?:string|null;metadata?:unknown}){
  const amount=money(input.amount); const currency=String(input.currency||'').toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency))throw new Error('INVALID_CURRENCY');
  const r=await tx.query<{id:string}>(`insert into trust_post_sale_financial_events(event_type,return_id,payment_id,refund_id,payout_id,merchant_id,amount,currency,idempotency_key,metadata_json) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) on conflict(idempotency_key) do nothing returning id`,[input.eventType,input.returnId??null,input.paymentId??null,input.refundId??null,input.payoutId??null,input.merchantId??null,amount,currency,input.idempotencyKey,JSON.stringify(input.metadata??{})]);
  if(r.rows[0])return {eventId:r.rows[0].id,replay:false};
  const prior=await tx.query<{id:string;amount:string;currency:string}>('select id,amount,currency from trust_post_sale_financial_events where idempotency_key=$1 for update',[input.idempotencyKey]);
  if(!prior.rows[0])throw new Error('FINANCIAL_EVENT_RETRY_REQUIRED');
  if(Number(prior.rows[0].amount)!==amount||String(prior.rows[0].currency)!==currency)throw new Error('FINANCIAL_EVENT_IDEMPOTENCY_REUSE');
  return {eventId:prior.rows[0].id,replay:true};
}

export async function postRefundAccountingTx(tx:SqlExecutor,input:{refundId:string;orderId:string;amount:number;currency:string}){
  const amount=money(input.amount); const currency=String(input.currency).toUpperCase();
  const key=`post-sale:refund:${input.refundId}`;
  const existing=await tx.query<{id:string}>('select id from trust_accounting_journals where journal_key=$1 for update',[key]);
  if(existing.rows[0])return {journalId:existing.rows[0].id,replay:true};
  const cashCode=`REFUND_CASH_${currency}`; const liabilityCode=`CUSTOMER_REFUND_LIABILITY_${currency}`;
  const cash=await tx.query<{id:string}>(`insert into trust_accounting_accounts(code,name,account_type,currency,owner_type) values($1,$2,'ASSET',$3,'PLATFORM') on conflict(code) do update set name=excluded.name returning id`,[cashCode,'Refund cash clearing',currency]);
  const liability=await tx.query<{id:string}>(`insert into trust_accounting_accounts(code,name,account_type,currency,owner_type) values($1,$2,'LIABILITY',$3,'PLATFORM') on conflict(code) do update set name=excluded.name returning id`,[liabilityCode,'Customer refund liability',currency]);
  const journal=await tx.query<{id:string}>(`insert into trust_accounting_journals(journal_key,reference_type,reference_id,currency,description) values($1,'REFUND',$2,$3,$4) returning id`,[key,input.refundId,currency,`Refund for order ${input.orderId}`]);
  await tx.query(`insert into trust_accounting_entries(journal_id,account_id,direction,amount,currency,sequence) values($1,$2,'DEBIT',$3,$4,1),($1,$5,'CREDIT',$3,$4,2)`,[journal.rows[0].id,liability.rows[0].id,amount,currency,cash.rows[0].id]);
  return {journalId:journal.rows[0].id,replay:false};
}

export async function recoverReturnInventoryTx(tx:SqlExecutor,input:{returnId:string;idempotencyKey:string}){
  const items=await tx.query<{id:string;order_item_id:string;quantity:number;product_id:string;condition:string}>(`select ri.id,ri.order_item_id,ri.quantity,oi.product_id,ri.condition from trust_return_items ri join trust_order_items oi on oi.id=ri.order_item_id where ri.return_id=$1 for update`,[input.returnId]);
  let recovered=0; let quarantined=0;
  for(const item of items.rows){
    const disposition=['SEALED','OPENED'].includes(String(item.condition))?'RESTOCK':String(item.condition)==='DEFECTIVE'?'RETURN_TO_VENDOR':'QUARANTINE';
    const key=`${input.idempotencyKey}:item:${item.id}`;
    const inserted=await tx.query<{id:string}>(`insert into trust_return_inventory_recoveries(return_id,return_item_id,product_id,quantity,disposition,idempotency_key) values($1,$2,$3,$4,$5,$6) on conflict(return_item_id) do nothing returning id`,[input.returnId,item.id,item.product_id,item.quantity,disposition,key]);
    if(!inserted.rows[0])continue;
    if(disposition==='RESTOCK'){
      await returnInventoryTransactionTx(tx as any, { productId:String(item.product_id), quantity:Number(item.quantity), returnId:input.returnId, idempotencyKey:`post-sale:return:${input.returnId}:item:${item.id}`, source:'POST_SALE_RETURN_RESTOCK' }); recovered+=Number(item.quantity);
    }else quarantined+=Number(item.quantity);
  }
  return {recovered,quarantined};
}
