import { query } from '../../platform/db/postgres';
export type ReturnStatus='requested'|'approved'|'rejected'|'received'|'refunded';
export type ReturnRequest={id:string;orderId:string;customerId:string;reason:string;status:ReturnStatus;createdAt:string};
function mapRow(r:any):ReturnRequest{return{id:String(r.id),orderId:String(r.order_id),customerId:String(r.customer_id),reason:String(r.reason),status:r.status as ReturnStatus,createdAt:new Date(r.created_at).toISOString()};}
export async function requestReturn(input:Omit<ReturnRequest,'id'|'status'|'createdAt'>){if(!input.reason.trim())throw new Error('RETURN_REASON_REQUIRED');const result=await query(`insert into trust_returns(order_id,customer_id,reason,status) values($1,$2,$3,'requested') returning id,order_id,customer_id,reason,status,created_at`,[input.orderId,input.customerId,input.reason.trim()]);return mapRow(result.rows[0]);}
export async function getCustomerReturns(customerId:string){const result=await query(`select id,order_id,customer_id,reason,status,created_at from trust_returns where customer_id=$1 order by created_at desc`,[customerId]);return result.rows.map(mapRow);}
export async function getReturn(id:string){const result=await query(`select id,order_id,customer_id,reason,status,created_at from trust_returns where id=$1 limit 1`,[id]);return result.rows[0]?mapRow(result.rows[0]):undefined;}
