import { createHash, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, withPgTransaction } from './db/postgres.ts';
import { ensureRuntimeOperationTx } from './runtime-spine.ts';

type CommandInput = {
  tenantId?: string;
  commandType: string;
  aggregateType: string;
  aggregateId: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
};

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function submitCommandTx(tx: PoolClient, input: CommandInput) {
  if (!input.commandType || !input.aggregateType || !input.aggregateId || !input.idempotencyKey) {
    throw new Error('COMMAND_IDENTITY_REQUIRED');
  }
  const tenantId = input.tenantId ?? 'default';
  const payload = input.payload ?? {};
  const requestHash = hash({ commandType: input.commandType, aggregateType: input.aggregateType, aggregateId: input.aggregateId, payload });
  const existing = await tx.query<any>(
    `SELECT id,status,request_hash,result_json FROM trust_commands
      WHERE tenant_id=$1 AND command_type=$2 AND idempotency_key=$3 LIMIT 1`,
    [tenantId,input.commandType,input.idempotencyKey],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== requestHash) throw new Error('COMMAND_IDEMPOTENCY_CONFLICT');
    return { commandId: String(existing.rows[0].id), replay: true, status: existing.rows[0].status, result: existing.rows[0].result_json ?? null };
  }
  const inserted = await tx.query<any>(
    `INSERT INTO trust_commands
      (tenant_id,command_type,aggregate_type,aggregate_id,idempotency_key,request_hash,payload_json,actor_id,correlation_id,causation_id)
     VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)
     RETURNING id,status`,
    [tenantId,input.commandType,input.aggregateType,input.aggregateId,input.idempotencyKey,requestHash,JSON.stringify(payload),input.actorId??null,input.correlationId??null,input.causationId??null],
  );
  const commandId = String(inserted.rows[0].id);
  await ensureRuntimeOperationTx(tx,{tenantId,operationType:'command',operationKey:commandId,aggregateType:input.aggregateType,aggregateId:input.aggregateId,commandId,correlationId:input.correlationId,causationId:input.causationId,metadata:{commandType:input.commandType}});
  await tx.query(
    `INSERT INTO trust_outbox_events(event_type,aggregate_id,payload_json,tenant_id,correlation_id,causation_id)
     VALUES('commerce.command.requested',$1,$2::jsonb,$3,$4,$5,$6)
     ON CONFLICT(tenant_id,event_type,aggregate_id,event_key) WHERE event_key IS NOT NULL DO UPDATE SET event_key=EXCLUDED.event_key`,
    [commandId,JSON.stringify({commandId,commandType:input.commandType,aggregateType:input.aggregateType,aggregateId:input.aggregateId}),tenantId,input.correlationId??null,input.causationId??null,`command-request:${commandId}`],
  );
  return { commandId, replay: false, status: 'PENDING', result: null };
}

export async function submitCommand(input: CommandInput) {
  return withPgTransaction(tx => submitCommandTx(tx,input));
}

export async function commandSnapshot(commandId: string) {
  const result = await query<any>(`SELECT id,tenant_id AS "tenantId",command_type AS "commandType",aggregate_type AS "aggregateType",aggregate_id AS "aggregateId",status,attempts,result_json AS result,last_error AS "lastError",created_at AS "createdAt",updated_at AS "updatedAt",completed_at AS "completedAt",actor_id AS "actorId" FROM trust_commands WHERE id=$1`,[commandId]);
  return result.rows[0] ?? null;
}

export const COMMAND_BUS_VERSION = 'V404.0.0';
export const commandWorkerId = () => `command-worker-${randomUUID()}`;
