import {createHash} from 'node:crypto';
import type {SqlExecutor} from '../persistence/postgres-boundary';
import type {GuardianAction,GuardianActionRisk,GuardianPlan} from './contracts';
import type {PurchasePassport} from '../../commerce/purchase-guardian/contracts';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function uuid(v:string){if(!UUID.test(v))throw new Error('CUSTOMER_ID_REQUIRED');return v;}
function risk(type:GuardianAction['type']):GuardianActionRisk{return type==='resolve_attention'?'high':type==='review_return'?'medium':'low';}
export function planGuardianActions(customerId:string,purchases:PurchasePassport[],now=Date.now()):GuardianPlan{
 uuid(customerId); const actions:GuardianAction[]=[]; const seen=new Set<string>();
 for(const p of purchases){for(const alert of p.alerts){const key=`${p.orderId}:${alert.action}`;if(seen.has(key))continue;seen.add(key);const r=risk(alert.action as GuardianAction['type']);actions.push({id:stableId(customerId,key),customerId,orderId:p.orderId,type:alert.action as GuardianAction['type'],risk:r,confidence:r==='low'?0.98:r==='medium'?0.93:0.84,reversible:r!=='high',status:r==='high'?'APPROVAL_REQUIRED':'PROPOSED',reason:alert.message,createdAt:new Date(now).toISOString()});}}
 return {customerId,actions,policyVersion:'183.1'};
}
function stableId(customerId:string,key:string){return [createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(0,8),createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(8,12),'4'+createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(13,16),((parseInt(createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(16,18),16)&0x3f)|0x80).toString(16)+createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(18,20),createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(20,32)].join('-');
}
export async function persistGuardianPlan(db:SqlExecutor,plan:GuardianPlan){uuid(plan.customerId);for(const a of plan.actions){await db.query(`insert into trust_purchase_guardian_actions(id,customer_id,order_id,action_type,risk,confidence,reversible,status,reason) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,[a.id,plan.customerId,a.orderId,a.type,a.risk,a.confidence,a.reversible,a.status,a.reason]);}return plan.actions.length;}
export async function approveGuardianAction(db:SqlExecutor,customerId:string,actionId:string){uuid(customerId);const r=await db.query<{id:string;status:string}>(`update trust_purchase_guardian_actions set status='APPROVED',approved_at=now(),updated_at=now() where id=$1 and customer_id=$2 and status='APPROVAL_REQUIRED' returning id,status`,[actionId,customerId]);if(!r.rows[0])throw new Error('ACTION_NOT_APPROVABLE');return r.rows[0];}
