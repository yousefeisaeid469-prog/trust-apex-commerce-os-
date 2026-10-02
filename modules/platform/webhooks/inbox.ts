import { createHash } from 'node:crypto';
import type { SqlExecutor } from '../persistence/postgres-boundary';
export function webhookFingerprint(provider:string,eventId:string,payload:unknown){return createHash('sha256').update(`${provider}:${eventId}:${JSON.stringify(payload)}`).digest('hex');}
export async function ingestWebhook(db:SqlExecutor,input:{provider:string;eventId:string;eventType:string;payload:unknown;signature?:string}) {
  const fp=webhookFingerprint(input.provider,input.eventId,input.payload);
  const inserted=await db.query<{id:string}>(`insert into trust_webhook_inbox(provider,event_id,event_type,payload_json,signature,fingerprint,status) values($1,$2,$3,$4::jsonb,$5,$6,'received') on conflict(provider,event_id) do nothing returning id`,[input.provider,input.eventId,input.eventType,JSON.stringify(input.payload),input.signature??null,fp]);
  if(!inserted.rows[0]){
    const existing=await db.query<{id:string;status:string;fingerprint:string}>(`select id,status,fingerprint from trust_webhook_inbox where provider=$1 and event_id=$2`,[input.provider,input.eventId]);
    if(!existing.rows[0]) throw new Error('WEBHOOK_RETRY_REQUIRED');
    if(existing.rows[0].fingerprint!==fp) throw new Error('WEBHOOK_EVENT_FINGERPRINT_MISMATCH');
    return {id:String(existing.rows[0].id),duplicate:true,status:existing.rows[0].status};
  }
  return {id:String(inserted.rows[0].id),duplicate:false,status:'received'};
}
export async function markWebhook(db:SqlExecutor,id:string,status:'processed'|'failed',error?:string){await db.query(`update trust_webhook_inbox set status=$2,last_error=$3,processed_at=case when $2='processed' then now() else processed_at end,processing_attempts=processing_attempts+1,updated_at=now() where id=$1`,[id,status,error??null]);}
