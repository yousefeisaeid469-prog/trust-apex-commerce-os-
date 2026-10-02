import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureIdempotency, requestHash, saveIdempotency } from '../../platform/persistence/transaction-store';
import { postLedgerEntry } from './ledger';
import { positiveMoney, requiredId, normalizedCurrency } from './contracts';

export const COMPENSATION_REASONS = ['SERVICE_FAILURE','DAMAGED_IN_TRANSIT','LATE_DELIVERY','WRONG_ITEM','PARTIAL_FULFILLMENT','GOODWILL'] as const;
export type CompensationReason = typeof COMPENSATION_REASONS[number];
export const COMPENSATION_METHODS = ['STORE_CREDIT','REFUND_ADJUSTMENT'] as const;
export type CompensationMethod = typeof COMPENSATION_METHODS[number];
export const COMPENSATION_STATUSES = ['REQUESTED','APPROVED','ISSUED','REVERSED','REJECTED'] as const;
export type CompensationStatus = typeof COMPENSATION_STATUSES[number];

export type CompensationRequest = {
  returnId?: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency?: string;
  reason: CompensationReason;
  method: CompensationMethod;
  note?: string;
  actorId: string;
  idempotencyKey: string;
};

function normalizeNote(v: unknown) { return typeof v === 'string' ? v.trim().slice(0,1000) : undefined; }
function map(row:any){return {id:row.id,orderId:row.order_id,returnId:row.return_id,customerId:row.customer_id,amount:Number(row.amount),currency:row.currency,reason:row.reason,method:row.method,status:row.status,note:row.note,createdAt:row.created_at,updatedAt:row.updated_at};}

export function compensationLimit(reason: CompensationReason): number {
  switch(reason){
    case 'DAMAGED_IN_TRANSIT': return 5000;
    case 'LATE_DELIVERY': return 1500;
    case 'WRONG_ITEM': return 3000;
    case 'PARTIAL_FULFILLMENT': return 4000;
    case 'SERVICE_FAILURE': return 2500;
    case 'GOODWILL': return 1000;
  }
}

export function validateCompensation(input: Pick<CompensationRequest,'amount'|'reason'|'method'>){
  const amount=positiveMoney(input.amount); if(amount===undefined)throw new Error('INVALID_COMPENSATION_AMOUNT');
  if(!COMPENSATION_REASONS.includes(input.reason))throw new Error('INVALID_COMPENSATION_REASON');
  if(!COMPENSATION_METHODS.includes(input.method))throw new Error('INVALID_COMPENSATION_METHOD');
  if(amount>compensationLimit(input.reason))throw new Error('COMPENSATION_LIMIT_EXCEEDED');
  return {amount,reason:input.reason,method:input.method,limit:compensationLimit(input.reason)};
}

export async function requestCompensation(db:SqlExecutor,input:CompensationRequest){
  const orderId=requiredId(input.orderId,'order_id'); const customerId=requiredId(input.customerId,'customer_id'); const actorId=requiredId(input.actorId,'actor_id'); const key=requiredId(input.idempotencyKey,'idempotency_key'); const currency=normalizedCurrency(input.currency); const policy=validateCompensation(input);
  return db.transaction(async tx=>{
    const hash=requestHash('compensation.request',{orderId,returnId:input.returnId||null,customerId,amount:policy.amount,currency,reason:policy.reason,method:policy.method,note:normalizeNote(input.note)});
    const cached=await ensureIdempotency(tx,key,'compensation.request',hash); if(cached)return {...(cached as object),replay:true};
    const order=await tx.query<any>('select id,customer_id,total,status from trust_orders where id=$1 for update',[orderId]); if(!order.rows[0])throw new Error('ORDER_NOT_FOUND'); if(order.rows[0].customer_id!==customerId)throw new Error('ORDER_ACCESS_DENIED'); if(['cancelled','pending'].includes(order.rows[0].status))throw new Error('ORDER_NOT_COMPENSABLE');
    if(input.returnId){const ret=await tx.query<any>('select id,customer_id,status from trust_returns where id=$1 for update',[requiredId(input.returnId,'return_id')]);if(!ret.rows[0])throw new Error('RETURN_NOT_FOUND');if(ret.rows[0].customer_id!==customerId)throw new Error('RETURN_ACCESS_DENIED');if(['REQUESTED','REJECTED'].includes(ret.rows[0].status))throw new Error('RETURN_NOT_COMPENSABLE');}
    const duplicate=await tx.query<any>(`select * from trust_customer_compensations where order_id=$1 and status in ('REQUESTED','APPROVED','ISSUED') and reason=$2 limit 1`,[orderId,policy.reason]);if(duplicate.rows[0])throw new Error('DUPLICATE_COMPENSATION');
    const inserted=await tx.query<any>(`insert into trust_customer_compensations(order_id,return_id,customer_id,amount,currency,reason,method,status,note,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,'REQUESTED',$8,$9) returning *`,[orderId,input.returnId||null,customerId,policy.amount,currency,policy.reason,policy.method,normalizeNote(input.note),key]);
    await tx.query(`insert into trust_compensation_events(compensation_id,from_status,to_status,source,actor_id,note) values($1,null,'REQUESTED','operations',$2,$3)`,[inserted.rows[0].id,actorId,normalizeNote(input.note)||null]);
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('customer_compensation.requested',$1,$2::jsonb)`,[inserted.rows[0].id,JSON.stringify({compensationId:inserted.rows[0].id,orderId,returnId:input.returnId||null,customerId,amount:policy.amount,currency,reason:policy.reason,method:policy.method,actorId})]);
    const result=map(inserted.rows[0]); await saveIdempotency(tx,key,'compensation.request',result,86400,hash); return {...result,replay:false};
  });
}

export async function approveCompensation(db:SqlExecutor,input:{compensationId:string;actorId:string;note?:string}){
  const id=requiredId(input.compensationId,'compensation_id');const actorId=requiredId(input.actorId,'actor_id');
  return db.transaction(async tx=>{const row=await tx.query<any>('select * from trust_customer_compensations where id=$1 for update',[id]);if(!row.rows[0])throw new Error('COMPENSATION_NOT_FOUND');if(row.rows[0].status!=='REQUESTED')throw new Error('COMPENSATION_NOT_REQUESTED');await tx.query(`update trust_customer_compensations set status='APPROVED',updated_at=now() where id=$1`,[id]);await tx.query(`insert into trust_compensation_events(compensation_id,from_status,to_status,source,actor_id,note) values($1,'REQUESTED','APPROVED','operations',$2,$3)`,[id,actorId,normalizeNote(input.note)||null]);return {...map(row.rows[0]),status:'APPROVED'};});
}

export async function issueCompensation(db:SqlExecutor,input:{compensationId:string;actorId:string;idempotencyKey:string}){
  const id=requiredId(input.compensationId,'compensation_id');const actorId=requiredId(input.actorId,'actor_id');const key=requiredId(input.idempotencyKey,'idempotency_key');
  return db.transaction(async tx=>{const hash=requestHash('compensation.issue',{id});const cached=await ensureIdempotency(tx,key,'compensation.issue',hash);if(cached)return {...(cached as object),replay:true};const row=await tx.query<any>('select * from trust_customer_compensations where id=$1 for update',[id]);if(!row.rows[0])throw new Error('COMPENSATION_NOT_FOUND');if(row.rows[0].status!=='APPROVED')throw new Error('COMPENSATION_NOT_APPROVED');
    if(row.rows[0].method==='REFUND_ADJUSTMENT'){await postLedgerEntry(tx,{customerId:row.rows[0].customer_id,returnId:row.rows[0].return_id||undefined,entryType:'REFUND',direction:'CREDIT',amount:Number(row.rows[0].amount),currency:row.rows[0].currency,referenceKey:`compensation-refund:${id}`,metadata:{compensationId:id,actorId}});}
    else {await postLedgerEntry(tx,{customerId:row.rows[0].customer_id,returnId:row.rows[0].return_id||undefined,entryType:'STORE_CREDIT_ISSUE',direction:'CREDIT',amount:Number(row.rows[0].amount),currency:row.rows[0].currency,referenceKey:`compensation-credit:${id}`,metadata:{compensationId:id,actorId}});}
    await tx.query(`update trust_customer_compensations set status='ISSUED',updated_at=now() where id=$1`,[id]);await tx.query(`insert into trust_compensation_events(compensation_id,from_status,to_status,source,actor_id) values($1,'APPROVED','ISSUED','operations',$2)`,[id,actorId]);await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('customer_compensation.issued',$1,$2::jsonb)`,[id,JSON.stringify({compensationId:id,method:row.rows[0].method,amount:Number(row.rows[0].amount),actorId})]);const result={compensationId:id,status:'ISSUED',amount:Number(row.rows[0].amount)};await saveIdempotency(tx,key,'compensation.issue',result,86400,hash);return {...result,replay:false};
  });
}

export async function reverseCompensation(db:SqlExecutor,input:{compensationId:string;actorId:string;idempotencyKey:string;reason:string}){
  const id=requiredId(input.compensationId,'compensation_id');const actorId=requiredId(input.actorId,'actor_id');const key=requiredId(input.idempotencyKey,'idempotency_key');const reason=normalizeNote(input.reason);if(!reason)throw new Error('REVERSAL_REASON_REQUIRED');
  return db.transaction(async tx=>{const hash=requestHash('compensation.reverse',{id,reason});const cached=await ensureIdempotency(tx,key,'compensation.reverse',hash);if(cached)return {...(cached as object),replay:true};const row=await tx.query<any>('select * from trust_customer_compensations where id=$1 for update',[id]);if(!row.rows[0])throw new Error('COMPENSATION_NOT_FOUND');if(row.rows[0].status==='REVERSED')return {compensationId:id,status:'REVERSED',replay:false};if(row.rows[0].status!=='ISSUED')throw new Error('COMPENSATION_NOT_ISSUED');
    await postLedgerEntry(tx,{customerId:row.rows[0].customer_id,returnId:row.rows[0].return_id||undefined,entryType:row.rows[0].method==='REFUND_ADJUSTMENT'?'REFUND':'STORE_CREDIT_REVERSE',direction:'DEBIT',amount:Number(row.rows[0].amount),currency:row.rows[0].currency,referenceKey:`compensation-reversal:${id}`,metadata:{compensationId:id,actorId,reason}});
    await tx.query(`update trust_customer_compensations set status='REVERSED',updated_at=now() where id=$1`,[id]);await tx.query(`insert into trust_compensation_events(compensation_id,from_status,to_status,source,actor_id,note) values($1,'ISSUED','REVERSED','operations',$2,$3)`,[id,actorId,reason]);await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('customer_compensation.reversed',$1,$2::jsonb)`,[id,JSON.stringify({compensationId:id,actorId,reason})]);const result={compensationId:id,status:'REVERSED',amount:Number(row.rows[0].amount)};await saveIdempotency(tx,key,'compensation.reverse',result,86400,hash);return {...result,replay:false};
  });
}

export async function listCustomerCompensations(db:SqlExecutor,customerId:string,limit=100){const id=requiredId(customerId,'customer_id');const n=Math.min(Math.max(Number(limit)||100,1),250);const result=await db.query<any>('select * from trust_customer_compensations where customer_id=$1 order by created_at desc limit $2',[id,n]);return result.rows.map(map);}
export async function listCompensationOperations(db:SqlExecutor,status?:CompensationStatus,limit=100){const n=Math.min(Math.max(Number(limit)||100,1),250);const result=status?await db.query<any>('select * from trust_customer_compensations where status=$1 order by updated_at asc limit $2',[status,n]):await db.query<any>('select * from trust_customer_compensations order by updated_at asc limit $1',[n]);return result.rows.map(map);}
export async function compensationExposure(db:SqlExecutor){const result=await db.query<any>(`select count(*)::int count,coalesce(sum(amount) filter(where status in ('REQUESTED','APPROVED','ISSUED')),0)::numeric active,coalesce(sum(amount) filter(where status='ISSUED'),0)::numeric issued,coalesce(sum(amount) filter(where status='REVERSED'),0)::numeric reversed from trust_customer_compensations`);const r=result.rows[0]||{};return {count:Number(r.count||0),active:Number(r.active||0),issued:Number(r.issued||0),reversed:Number(r.reversed||0)};}
