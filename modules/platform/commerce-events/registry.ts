import type { PoolClient } from 'pg';
import { query } from '../db/postgres.ts';

export async function getSubscription(consumerId: string, eventType: string) {
  const result = await query<any>(
    `select consumer_id,event_type,enabled,contract_version,max_attempts
       from trust_consumer_subscriptions where consumer_id=$1 and event_type=$2`,
    [consumerId, eventType],
  );
  return result.rows[0] ?? null;
}

export async function listEnabledSubscriptions(eventType?: string) {
  const result = await query<any>(
    `select consumer_id,event_type,enabled,contract_version,max_attempts
       from trust_consumer_subscriptions
      where enabled=true ${eventType ? 'and event_type=$1' : ''}
      order by consumer_id,event_type`,
    eventType ? [eventType] : [],
  );
  return result.rows;
}

export async function setSubscription(input: { consumerId:string; eventType:string; enabled:boolean; contractVersion?:number; maxAttempts?:number }) {
  const result = await query<any>(
    `insert into trust_consumer_subscriptions(consumer_id,event_type,enabled,contract_version,max_attempts)
     values($1,$2,$3,$4,$5)
     on conflict(consumer_id,event_type) do update set enabled=excluded.enabled,contract_version=excluded.contract_version,max_attempts=excluded.max_attempts,updated_at=now()
     returning consumer_id,event_type,enabled,contract_version,max_attempts`,
    [input.consumerId,input.eventType,input.enabled,input.contractVersion ?? 1,input.maxAttempts ?? 8],
  );
  return result.rows[0];
}

export async function getEventSchema(eventType: string, version = 1) {
  const result = await query<any>(`select event_type,version,schema_json,status from trust_event_schema_versions where event_type=$1 and version=$2`,[eventType,version]);
  return result.rows[0] ?? null;
}

export async function registerEventSchema(input:{eventType:string;version:number;schemaJson:Record<string,unknown>;status?:'ACTIVE'|'DEPRECATED'|'RETIRED'}) {
  const result = await query<any>(
    `insert into trust_event_schema_versions(event_type,version,schema_json,status) values($1,$2,$3::jsonb,$4)
     on conflict(event_type,version) do update set schema_json=excluded.schema_json,status=excluded.status returning event_type,version,schema_json,status`,
    [input.eventType,input.version,JSON.stringify(input.schemaJson),input.status ?? 'ACTIVE'],
  );
  return result.rows[0];
}

export async function enqueueSubscribedDeliveriesTx(tx: PoolClient, input:{tenantId:string;eventId:string;eventType:string}) {
  const subscriptions = await tx.query<{consumer_id:string}>(
    `select consumer_id from trust_consumer_subscriptions where event_type=$1 and enabled=true`,[input.eventType],
  );
  for (const row of subscriptions.rows) {
    await tx.query(
      `insert into trust_event_deliveries(tenant_id,event_id,consumer_id,status,attempts,next_attempt_at)
       values($1,$2,$3,'PENDING',0,now()) on conflict(tenant_id,event_id,consumer_id) do nothing`,
      [input.tenantId,input.eventId,row.consumer_id],
    );
  }
  return subscriptions.rows.length;
}

export async function validateEventContractTx(tx: PoolClient, eventType:string, version:number, payload:unknown) {
  const result = await tx.query<any>(`select schema_json,status from trust_event_schema_versions where event_type=$1 and version=$2`,[eventType,version]);
  const schema = result.rows[0];
  if (!schema) throw new Error(`EVENT_SCHEMA_NOT_REGISTERED:${eventType}:v${version}`);
  if (schema.status !== 'ACTIVE') throw new Error(`EVENT_SCHEMA_NOT_ACTIVE:${eventType}:v${version}`);
  const expected = schema.schema_json ?? {};
  if (expected.type === 'object' && (payload === null || typeof payload !== 'object' || Array.isArray(payload))) throw new Error(`EVENT_SCHEMA_TYPE_MISMATCH:${eventType}:v${version}`);
  return true;
}
