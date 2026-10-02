import { randomUUID } from 'node:crypto';
import { query } from '../db/postgres';
import type { PoolClient } from 'pg';
import {notificationForOrderStatus,buildDedupeKey,allowedTopic,type NotificationChannel,type NotificationTopic,type NotificationRecord,type NotificationPreference,type NotificationAdapter} from './contracts';

export {notificationForOrderStatus,buildDedupeKey,allowedTopic} from './contracts';

export async function queueOrderStatusNotifications(input:{orderId:string;customerId:string;status:string}){
  const spec=notificationForOrderStatus(input.status,input.orderId); if(!spec) return [];
  const channels:NotificationChannel[]=['IN_APP','EMAIL','SMS','WHATSAPP'];
  const prefs=(await query(`select channel,topic,enabled from trust_notification_preferences where customer_id=$1 and topic=$2`,[input.customerId,spec.topic])).rows;
  const enabled=new Map(prefs.map((p:any)=>[String(p.channel),Boolean(p.enabled)]));
  const inserted=[];
  for(const channel of channels){
    if(channel!=='IN_APP' && enabled.has(channel) && !enabled.get(channel)) continue;
    const dedupeKey=buildDedupeKey(input.orderId,spec.topic,channel);
    const r=await query(`insert into platform_notifications(id,recipient_id,channel,topic,title,body,dedupe_key,status) values($1,$2,$3,$4,$5,$6,$7,'QUEUED') on conflict(dedupe_key) do nothing returning *`,[randomUUID(),input.customerId,channel,spec.topic,spec.title,spec.body(input.orderId),dedupeKey]);
    if(r.rows[0]) inserted.push(r.rows[0]);
  }
  return inserted;
}

export async function listForCustomer(customerId:string,limit=50){
  const safe=Math.min(Math.max(Math.floor(limit),1),100);
  return (await query(`select id,recipient_id,channel,topic,title,body,dedupe_key,status,created_at,sent_at,read_at,last_error,attempts from platform_notifications where recipient_id=$1 order by created_at desc limit $2`,[customerId,safe])).rows;
}

export async function setPreference(input:NotificationPreference){
  await query(`insert into trust_notification_preferences(customer_id,channel,topic,enabled,updated_at) values($1,$2,$3,$4,now()) on conflict(customer_id,channel,topic) do update set enabled=excluded.enabled,updated_at=now()`,[input.customerId,input.channel,input.topic,input.enabled]);
  return input;
}

export async function claimNotifications(limit=20,workerId='notification-worker'){
  const safe=Math.min(Math.max(Math.floor(limit),1),100);
  return (await query(`with picked as (select id from platform_notifications where (status='QUEUED' or (status='PROCESSING' and lease_until<=now())) order by created_at for update skip locked limit $1) update platform_notifications n set status='PROCESSING',attempts=n.attempts+1,lease_until=now()+interval '5 minutes',locked_by=$2,updated_at=now() from picked where n.id=picked.id returning n.*`,[safe,workerId])).rows;
}

export async function recoverExpiredNotifications(){
  const r=await query(`update platform_notifications set status=case when attempts>=5 then 'FAILED' else 'QUEUED' end,lease_until=null,locked_by=null,last_error=case when attempts>=5 then coalesce(last_error,'MAX_ATTEMPTS_EXCEEDED') else coalesce(last_error,'WORKER_LEASE_EXPIRED') end,updated_at=now() where status='PROCESSING' and lease_until<=now() returning id`);
  return r.rows.length;
}

export async function processNotification(row:any,adapters:NotificationAdapter[],workerId='notification-worker'){
  const guard=[row.id,workerId];
  if(row.channel==='IN_APP') { await query(`update platform_notifications set status='SENT',sent_at=now(),lease_until=null,locked_by=null,updated_at=now() where id=$1 and status='PROCESSING' and locked_by=$2`,guard); return {status:'SENT' as const}; }
  const adapter=adapters.find(a=>a.channel===row.channel);
  if(!adapter){await query(`update platform_notifications set status='FAILED',last_error='NO_DELIVERY_ADAPTER',lease_until=null,locked_by=null,updated_at=now() where id=$1 and status='PROCESSING' and locked_by=$2`,guard);return {status:'FAILED' as const,reason:'NO_DELIVERY_ADAPTER'};}
  const destination=(await query(`select u.email,p.phone from trust_users u left join trust_customer_profiles p on p.user_id=u.id where u.id=$1 limit 1`,[row.recipient_id])).rows[0];
  const target=row.channel==='EMAIL'?destination?.email:destination?.phone;
  if(!target){await query(`update platform_notifications set status='FAILED',last_error='NO_DESTINATION',lease_until=null,locked_by=null,updated_at=now() where id=$1 and status='PROCESSING' and locked_by=$2`,guard);return {status:'FAILED' as const,reason:'NO_DESTINATION'};}
  const result=await adapter.send({notification:row,destination:String(target)});
  await query(`update platform_notifications set status=$3,sent_at=case when $3='SENT' then now() else sent_at end,last_error=$4,lease_until=null,locked_by=null,updated_at=now() where id=$1 and status='PROCESSING' and locked_by=$2`,[row.id,workerId,result.status,result.reason??null]);
  return result;
}
