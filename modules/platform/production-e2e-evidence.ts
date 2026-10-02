import { query, withPgTransaction } from './db/postgres';

export type ProductionE2EEnvironment = 'SANDBOX'|'STAGING'|'LIVE';
export type ProductionE2EStepStatus = 'STARTED'|'PASSED'|'FAILED'|'SKIPPED';

export async function startProductionE2ERun(input:{runKey:string;environment:ProductionE2EEnvironment;appBaseUrl:string;provider:string}) {
  return withPgTransaction(async tx => {
    const row = await tx.query(`insert into trust_production_e2e_runs(run_key,environment,app_base_url,provider,status) values($1,$2,$3,$4,'RUNNING') on conflict(run_key) do update set status='RUNNING',started_at=now(),completed_at=null,summary_json='{}'::jsonb returning *`, [input.runKey,input.environment,input.appBaseUrl,input.provider]);
    return row.rows[0];
  });
}

export async function recordProductionE2EStep(input:{runId:string;stepKey:string;status:ProductionE2EStepStatus;evidence?:unknown;errorCode?:string;errorMessage?:string;startedAt?:Date;completedAt?:Date}) {
  const started = input.startedAt ?? new Date();
  const completed = input.completedAt ?? (input.status === 'STARTED' ? undefined : new Date());
  const durationMs = completed ? Math.max(0, completed.getTime() - started.getTime()) : null;
  return withPgTransaction(async tx => {
    const row = await tx.query(`insert into trust_production_e2e_steps(run_id,step_key,status,started_at,completed_at,duration_ms,evidence_json,error_code,error_message) values($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) on conflict(run_id,step_key) do update set status=excluded.status,completed_at=excluded.completed_at,duration_ms=excluded.duration_ms,evidence_json=excluded.evidence_json,error_code=excluded.error_code,error_message=excluded.error_message returning *`, [input.runId,input.stepKey,input.status,started,completed,durationMs,JSON.stringify(input.evidence ?? {}),input.errorCode ?? null,input.errorMessage ?? null]);
    return row.rows[0];
  });
}

export async function finishProductionE2ERun(input:{runId:string;status:'PASSED'|'FAILED';summary:unknown}) {
  const result = await query(`update trust_production_e2e_runs set status=$2,completed_at=now(),summary_json=$3::jsonb where id=$1 returning *`, [input.runId,input.status,JSON.stringify(input.summary ?? {})]);
  if (!result.rows[0]) throw new Error('PRODUCTION_E2E_RUN_NOT_FOUND');
  return result.rows[0];
}
