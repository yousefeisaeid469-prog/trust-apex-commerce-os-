import type { PaymentIntent } from './types';
import { query } from '../../platform/db/postgres';

function mapRow(r:any):PaymentIntent{return{id:String(r.id),orderId:String(r.order_id),customerId:String(r.customer_id),amount:Number(r.amount),currency:'EGP',status:r.status,provider:'adapter',providerReference:r.provider_reference??undefined,createdAt:new Date(r.created_at).toISOString(),updatedAt:new Date(r.updated_at).toISOString()};}
export async function createPaymentIntent(orderId:string,customerId:string,amount:number,idempotencyKey:string){
  if(!Number.isFinite(amount)||amount<=0)throw new Error('INVALID_PAYMENT_AMOUNT');
  const existing=await query(`select id,order_id,customer_id,amount,currency,status,provider,provider_reference,created_at,updated_at from trust_payment_intents where idempotency_key=$1 limit 1`,[idempotencyKey]);
  if(existing.rows[0])return mapRow(existing.rows[0]);
  const id=`pi_${crypto.randomUUID()}`;
  try{
    const result=await query(`insert into trust_payment_intents(id,order_id,customer_id,amount,currency,status,provider,idempotency_key) values($1,$2,$3,$4,'EGP','requires_confirmation','adapter',$5) returning id,order_id,customer_id,amount,currency,status,provider,provider_reference,created_at,updated_at`,[id,orderId,customerId,amount,idempotencyKey]);
    return mapRow(result.rows[0]);
  }catch(error:any){
    if(error?.code==='23505'){
      const retry=await query(`select id,order_id,customer_id,amount,currency,status,provider,provider_reference,created_at,updated_at from trust_payment_intents where idempotency_key=$1 limit 1`,[idempotencyKey]);
      if(retry.rows[0])return mapRow(retry.rows[0]);
    }
    throw error;
  }
}
export async function getPaymentIntent(id:string){const result=await query(`select id,order_id,customer_id,amount,currency,status,provider,provider_reference,created_at,updated_at from trust_payment_intents where id=$1 limit 1`,[id]);return result.rows[0]?mapRow(result.rows[0]):undefined;}
export async function markPaymentIntent(id:string,status:PaymentIntent['status'],providerReference?:string){
  const current=await getPaymentIntent(id); if(!current)throw new Error('PAYMENT_INTENT_NOT_FOUND');
  if(current.status==='succeeded'&&status!=='succeeded')throw new Error('PAYMENT_ALREADY_SUCCEEDED');
  const result=await query(`update trust_payment_intents set status=$2,provider_reference=coalesce($3,provider_reference),updated_at=now() where id=$1 returning id,order_id,customer_id,amount,currency,status,provider,provider_reference,created_at,updated_at`,[id,status,providerReference??null]);
  return mapRow(result.rows[0]);
}
