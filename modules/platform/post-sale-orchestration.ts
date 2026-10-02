import type { SqlExecutor } from './persistence/postgres-boundary';
import { randomUUID } from 'node:crypto';

export const POST_SALE_STAGES = ['RETURN_REQUESTED','RETURN_APPROVED','RETURN_RECEIVED','INSPECTION','REFUND_PENDING','REFUNDED','RETURN_REJECTED','CLOSED'] as const;
export type PostSaleStage = typeof POST_SALE_STAGES[number];

const stageByReturnStatus: Record<string, PostSaleStage> = {
  REQUESTED: 'RETURN_REQUESTED', APPROVED: 'RETURN_APPROVED', RECEIVED: 'RETURN_RECEIVED',
  INSPECTING: 'INSPECTION', APPROVED_REFUND: 'REFUND_PENDING', REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED', REJECTED: 'RETURN_REJECTED', CLOSED: 'CLOSED',
};
const topicByStage: Record<PostSaleStage, {topic:string; title:string; body:(id:string)=>string}> = {
  RETURN_REQUESTED:{topic:'RETURN_REQUESTED',title:'تم استلام طلب الإرجاع',body:id=>`تم استلام طلب الإرجاع #${id}.`},
  RETURN_APPROVED:{topic:'RETURN_APPROVED',title:'تمت الموافقة على الإرجاع',body:id=>`تمت الموافقة على الإرجاع #${id}.`},
  RETURN_RECEIVED:{topic:'RETURN_RECEIVED',title:'تم استلام المرتجع',body:id=>`تم استلام المرتجع الخاص بالطلب #${id}.`},
  INSPECTION:{topic:'RETURN_RECEIVED',title:'المرتجع قيد الفحص',body:id=>`المرتجع #${id} دخل مرحلة الفحص.`},
  REFUND_PENDING:{topic:'REFUND_PENDING',title:'الاسترداد قيد التنفيذ',body:id=>`استرداد المبلغ للطلب #${id} قيد التنفيذ.`},
  REFUNDED:{topic:'REFUND_SUCCEEDED',title:'تم الاسترداد',body:id=>`تم تأكيد استرداد المبلغ للطلب #${id}.`},
  RETURN_REJECTED:{topic:'RETURN_RECEIVED',title:'تم رفض الإرجاع',body:id=>`تم رفض طلب الإرجاع #${id}.`},
  CLOSED:{topic:'RETURN_RECEIVED',title:'تم إغلاق حالة الإرجاع',body:id=>`تم إغلاق حالة الإرجاع #${id}.`},
};

export function postSaleStageForReturnStatus(status:string): PostSaleStage|undefined { return stageByReturnStatus[status]; }

export async function syncPostSaleCaseTx(tx:SqlExecutor,input:{returnId:string;returnStatus:string;orderId:string;customerId?:string|null;event:string;metadata?:unknown}) {
  const stage=postSaleStageForReturnStatus(input.returnStatus); if(!stage) throw new Error('UNKNOWN_POST_SALE_RETURN_STATUS');
  const existing=await tx.query<{id:string;stage:PostSaleStage}>(`select id,stage from trust_post_sale_cases where return_id=$1 for update`,[input.returnId]);
  let caseId:string;
  if(existing.rows[0]) {
    caseId=existing.rows[0].id;
    await tx.query(`update trust_post_sale_cases set stage=$2,last_event=$3,updated_at=now() where id=$1`,[caseId,stage,input.event]);
  } else {
    const created=await tx.query<{id:string}>(`insert into trust_post_sale_cases(return_id,order_id,customer_id,stage,last_event) values($1,$2,$3,$4,$5) returning id`,[input.returnId,input.orderId,input.customerId??null,stage,input.event]);
    caseId=created.rows[0].id;
  }
  const spec=topicByStage[stage];
  if(input.customerId && spec) {
    const dedupe=`post-sale:${input.returnId}:${stage}`;
    await tx.query(`insert into platform_notifications(id,recipient_id,channel,topic,title,body,dedupe_key,status) values($1,$2,'IN_APP',$3,$4,$5,$6,'QUEUED') on conflict(dedupe_key) do nothing`,[randomUUID(),input.customerId,spec.topic,spec.title,spec.body(input.returnId),dedupe]);
  }
  return {caseId,stage};
}

export async function findPostSaleActionTx(tx:SqlExecutor,input:{returnId:string;action:string;idempotencyKey:string}) {
  const r=await tx.query('select a.id,a.result_json from trust_post_sale_actions a join trust_post_sale_cases c on c.id=a.case_id where c.return_id=$1 and a.action=$2 and a.idempotency_key=$3 limit 1',[input.returnId,input.action,input.idempotencyKey]);
  return r.rows[0] ? {actionId:r.rows[0].id,result:r.rows[0].result_json} : undefined;
}

export async function recordPostSaleActionTx(tx:SqlExecutor,input:{returnId:string;action:string;actorId?:string;idempotencyKey?:string;result?:unknown}) {
  const c=await tx.query<{id:string}>('select id from trust_post_sale_cases where return_id=$1',[input.returnId]);
  if(!c.rows[0]) throw new Error('POST_SALE_CASE_NOT_FOUND');
  const r=await tx.query<{id:string;result_json:unknown}>(`insert into trust_post_sale_actions(case_id,action,actor_id,idempotency_key,result_json) values($1,$2,$3,$4,$5::jsonb) on conflict(case_id,action,idempotency_key) do nothing returning id,result_json`,[c.rows[0].id,input.action,input.actorId??null,input.idempotencyKey??null,JSON.stringify(input.result??{})]);
  if(r.rows[0]) return {actionId:r.rows[0].id,replay:false,result:r.rows[0].result_json};
  const prior=await tx.query<{id:string;result_json:unknown}>('select id,result_json from trust_post_sale_actions where case_id=$1 and action=$2 and idempotency_key is not distinct from $3',[c.rows[0].id,input.action,input.idempotencyKey??null]);
  return {actionId:prior.rows[0]?.id,replay:true,result:prior.rows[0]?.result_json};
}

export async function getPostSaleCaseTx(tx:SqlExecutor,returnId:string) {
  const c=await tx.query('select * from trust_post_sale_cases where return_id=$1',[returnId]); if(!c.rows[0]) return undefined;
  const actions=await tx.query('select * from trust_post_sale_actions where case_id=$1 order by created_at asc',[c.rows[0].id]);
  const notifications=await tx.query(`select id,channel,topic,title,status,created_at,sent_at,read_at,last_error from platform_notifications where dedupe_key like $1 order by created_at asc`,[`post-sale:${returnId}:%`]);
  return {case:c.rows[0],actions:actions.rows,notifications:notifications.rows};
}

export async function listPostSaleCasesTx(tx:SqlExecutor,input:{stage?:string;limit?:number}) {
  const limit=Math.min(Math.max(Math.floor(input.limit??50),1),100);
  const valid=input.stage && POST_SALE_STAGES.includes(input.stage as PostSaleStage);
  const r=valid ? await tx.query(`select * from trust_post_sale_cases where stage=$1 order by updated_at asc limit $2`,[input.stage,limit]) : await tx.query(`select * from trust_post_sale_cases order by updated_at asc limit $1`,[limit]);
  return r.rows;
}
