import { randomUUID } from 'node:crypto';
import { query } from '../db/postgres';

export type JobState='QUEUED'|'RUNNING'|'SUCCEEDED'|'RETRYING'|'FAILED'|'DEAD';
export type Job={id:string;type:string;payload:unknown;state:JobState;attempts:number;maxAttempts:number;runAfter:string;createdAt:string;updatedAt:string;lastError?:string;lockedUntil?:string;lockedBy?:string;leaseToken?:string};
function mapJob(row:any):Job{return {id:String(row.id),type:String(row.type),payload:row.payload_json,state:row.state,attempts:Number(row.attempts),maxAttempts:Number(row.max_attempts),runAfter:new Date(row.run_after).toISOString(),createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString(),lastError:row.last_error??undefined,lockedUntil:row.locked_until?new Date(row.locked_until).toISOString():undefined,lockedBy:row.locked_by??undefined,leaseToken:row.lease_token??undefined};}

export async function enqueue(type:string,payload:unknown,maxAttempts=5,idempotencyKey?:string){
  if(!type.trim()||type.length>200) throw new Error('INVALID_JOB_TYPE');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>50) throw new Error('INVALID_MAX_ATTEMPTS');
  const r=await query(`insert into trust_jobs(type,payload_json,max_attempts,idempotency_key) values($1,$2::jsonb,$3,$4) on conflict (idempotency_key) where idempotency_key is not null do update set updated_at=trust_jobs.updated_at returning *`,[type,JSON.stringify(payload),maxAttempts,idempotencyKey??null]);
  return mapJob(r.rows[0]);
}

export async function claim(limit=20,workerId='worker'){
  const safe=Math.min(Math.max(Math.floor(limit),1),100); const token=randomUUID();
  return (await query(`with picked as (select id from trust_jobs where state in ('QUEUED','RETRYING') and run_after<=now() and attempts<max_attempts and (locked_until is null or locked_until<=now()) order by run_after,created_at for update skip locked limit $1) update trust_jobs j set state='RUNNING',attempts=j.attempts+1,locked_until=now()+interval '5 minutes',locked_by=$2,lease_token=$3,updated_at=now() from picked where j.id=picked.id returning j.*`,[safe,workerId,token])).rows.map(mapJob);
}

export async function renewLease(id:string,workerId:string,leaseToken:string,minutes=5){
  const safe=Math.min(Math.max(Math.floor(minutes),1),30);
  const r=await query(`update trust_jobs set locked_until=now()+make_interval(mins=>$4),updated_at=now() where id=$1 and state='RUNNING' and locked_by=$2 and lease_token=$3 and locked_until>now() returning *`,[id,workerId,leaseToken,safe]);
  return r.rows[0]?mapJob(r.rows[0]):null;
}
export async function complete(id:string,workerId?:string,leaseToken?:string){
  const guard=workerId&&leaseToken?' and state=\'RUNNING\' and locked_by=$2 and lease_token=$3':'';
  const params=workerId&&leaseToken?[id,workerId,leaseToken]:[id];
  const r=await query(`update trust_jobs set state='SUCCEEDED',locked_until=null,locked_by=null,lease_token=null,updated_at=now() where id=$1${guard} returning *`,params);
  return r.rows[0]?mapJob(r.rows[0]):null;
}
export async function fail(id:string,error:string,retry=true,workerId?:string,leaseToken?:string){
  const guard=workerId&&leaseToken?' and state=\'RUNNING\' and locked_by=$4 and lease_token=$5':'';
  const params=workerId&&leaseToken?[id,retry,error,workerId,leaseToken]:[id,retry,error];
  const r=await query(`update trust_jobs set state=case when $2 and attempts<max_attempts then 'RETRYING' when attempts>=max_attempts then 'DEAD' else 'FAILED' end,last_error=$3,run_after=case when $2 and attempts<max_attempts then now()+make_interval(secs=>least(3600,greatest(5,pow(2,greatest(attempts-1,0)))::int)) else run_after end,locked_until=null,locked_by=null,lease_token=null,updated_at=now() where id=$1${guard} returning *`,params);
  return r.rows[0]?mapJob(r.rows[0]):null;
}
export async function recoverExpiredLeases(){
  const r=await query(`update trust_jobs set state=case when attempts>=max_attempts then 'DEAD' else 'RETRYING' end,run_after=now(),locked_until=null,locked_by=null,lease_token=null,last_error=coalesce(last_error,'WORKER_LEASE_EXPIRED'),updated_at=now() where state='RUNNING' and locked_until<=now() returning id`); return r.rows.length;
}
export async function jobSnapshot(){return (await query(`select id,type,payload_json,state,attempts,max_attempts,run_after,created_at,updated_at,last_error,locked_until,locked_by,lease_token from trust_jobs order by created_at desc limit 100`)).rows.map(mapJob);}

export async function transition(id:string, state:JobState, error?:string) {
  if (state === 'SUCCEEDED') return complete(id);
  if (state === 'FAILED' || state === 'DEAD') return fail(id, error ?? state, false);
  if (state === 'RETRYING') return fail(id, error ?? 'RETRY_REQUESTED', true);
  throw new Error('INVALID_JOB_TRANSITION');
}
