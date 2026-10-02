import { createHash } from 'node:crypto';
import { query } from '../db/postgres';

const keyFor=(email:string,ip:string)=>createHash('sha256').update(`${email.trim().toLowerCase()}|${ip}`).digest('hex');
export async function recordLoginFailure(email:string,ip:string){
  const key=keyFor(email,ip);
  const r=await query<{failures:number;reset_at:Date;blocked_until:Date|null}>(`insert into trust_auth_rate_limits(bucket_key,failures,reset_at,blocked_until) values($1,1,now()+interval '15 minutes',null)
    on conflict(bucket_key) do update set failures=case when trust_auth_rate_limits.reset_at<=now() then 1 else trust_auth_rate_limits.failures+1 end,
    reset_at=case when trust_auth_rate_limits.reset_at<=now() then now()+interval '15 minutes' else trust_auth_rate_limits.reset_at end,
    blocked_until=case when (case when trust_auth_rate_limits.reset_at<=now() then 1 else trust_auth_rate_limits.failures+1 end)>=10 then now()+interval '15 minutes' else trust_auth_rate_limits.blocked_until end,
    updated_at=now() returning failures,reset_at,blocked_until`,[key]);
  return r.rows[0];
}
export async function loginAllowed(email:string,ip:string){
  const key=keyFor(email,ip); const r=await query<{blocked_until:Date|null;failures:number}>('select blocked_until,failures from trust_auth_rate_limits where bucket_key=$1',[key]);
  const row=r.rows[0]; return !row?.blocked_until || new Date(row.blocked_until).getTime()<=Date.now();
}
export async function clearLoginFailures(email:string,ip:string){await query('delete from trust_auth_rate_limits where bucket_key=$1',[keyFor(email,ip)]);}
