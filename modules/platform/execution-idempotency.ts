import { createHash } from 'node:crypto';
import type { SqlExecutor } from './persistence/postgres-boundary';

export type ExecutionClaim = {
  scope:string; operationKey:string; fingerprint:string; ownerId:string;
  fencingToken:bigint; leaseSeconds:number; replay:boolean;
  resultJson:Record<string,unknown>|null;
};

function stable(value:unknown):string {
  if(value===null || typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const o=value as Record<string,unknown>;
  return `{${Object.keys(o).sort().map(k=>`${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`;
}
export function executionFingerprint(value:unknown){
  return createHash('sha256').update(stable(value)).digest('hex');
}
function lease(value:number){return Math.min(Math.max(Math.floor(value||90),5),3600);}

export async function claimExecutionTx(tx:SqlExecutor,input:{scope:string;operationKey:string;fingerprint:string;ownerId:string;leaseSeconds?:number}):Promise<ExecutionClaim|null>{
  const seconds=lease(input.leaseSeconds??90);
  const existing=(await tx.query<any>(`SELECT * FROM trust_execution_claims WHERE scope=$1 AND operation_key=$2 FOR UPDATE`,[input.scope,input.operationKey])).rows[0];
  if(!existing){
    const row=(await tx.query<any>(`INSERT INTO trust_execution_claims(scope,operation_key,fingerprint,owner_id,fencing_token,lease_expires_at) VALUES($1,$2,$3,$4,1,now()+make_interval(secs=>$5)) RETURNING *`,[input.scope,input.operationKey,input.fingerprint,input.ownerId,seconds])).rows[0];
    await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action,metadata_json) VALUES($1,$2,$3,$4,'CLAIMED',$5::jsonb)`,[input.scope,input.operationKey,input.ownerId,row.fencing_token,JSON.stringify({leaseSeconds:seconds})]);
    return {scope:input.scope,operationKey:input.operationKey,fingerprint:input.fingerprint,ownerId:input.ownerId,fencingToken:BigInt(row.fencing_token),leaseSeconds:seconds,replay:false,resultJson:null};
  }
  if(String(existing.fingerprint)!==input.fingerprint){
    await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action,metadata_json) VALUES($1,$2,$3,$4,'FINGERPRINT_MISMATCH',$5::jsonb)`,[input.scope,input.operationKey,input.ownerId,existing.fencing_token,JSON.stringify({expected:existing.fingerprint,received:input.fingerprint})]);
    throw new Error('EXECUTION_FINGERPRINT_MISMATCH');
  }
  if(String(existing.status)==='SUCCEEDED'){
    await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action) VALUES($1,$2,$3,$4,'REPLAYED')`,[input.scope,input.operationKey,input.ownerId,existing.fencing_token]);
    return {scope:input.scope,operationKey:input.operationKey,fingerprint:input.fingerprint,ownerId:String(existing.owner_id),fencingToken:BigInt(existing.fencing_token),leaseSeconds:seconds,replay:true,resultJson:existing.result_json??{}};
  }
  if(new Date(existing.lease_expires_at).getTime()>Date.now() && String(existing.owner_id)!==input.ownerId){
    await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action,metadata_json) VALUES($1,$2,$3,$4,'BUSY',$5::jsonb)`,[input.scope,input.operationKey,input.ownerId,existing.fencing_token,JSON.stringify({currentOwner:existing.owner_id})]);
    return null;
  }
  const row=(await tx.query<any>(`UPDATE trust_execution_claims SET owner_id=$3,fencing_token=fencing_token+1,lease_expires_at=now()+make_interval(secs=>$4),attempts=attempts+1,status='RUNNING',last_error=null,updated_at=now(),completed_at=null WHERE scope=$1 AND operation_key=$2 RETURNING *`,[input.scope,input.operationKey,input.ownerId,seconds])).rows[0];
  await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action,metadata_json) VALUES($1,$2,$3,$4,'CLAIMED',$5::jsonb)`,[input.scope,input.operationKey,input.ownerId,row.fencing_token,JSON.stringify({takeover:true,leaseSeconds:seconds})]);
  return {scope:input.scope,operationKey:input.operationKey,fingerprint:input.fingerprint,ownerId:input.ownerId,fencingToken:BigInt(row.fencing_token),leaseSeconds:seconds,replay:false,resultJson:null};
}

export async function heartbeatExecutionClaimTx(tx:SqlExecutor,claim:ExecutionClaim){
  const r=await tx.query(`UPDATE trust_execution_claims SET lease_expires_at=now()+make_interval(secs=>$4),updated_at=now() WHERE scope=$1 AND operation_key=$2 AND owner_id=$3 AND fencing_token=$5 AND status='RUNNING' RETURNING fencing_token`,[claim.scope,claim.operationKey,claim.ownerId,claim.leaseSeconds,claim.fencingToken.toString()]);
  if(!r.rows[0]) throw new Error('EXECUTION_CLAIM_FENCED');
}
export async function completeExecutionClaimTx(tx:SqlExecutor,claim:ExecutionClaim,result:Record<string,unknown>){
  const r=await tx.query(`UPDATE trust_execution_claims SET status='SUCCEEDED',result_json=$5::jsonb,lease_expires_at=now(),completed_at=now(),updated_at=now() WHERE scope=$1 AND operation_key=$2 AND owner_id=$3 AND fencing_token=$4 AND status='RUNNING' RETURNING fencing_token`,[claim.scope,claim.operationKey,claim.ownerId,claim.fencingToken.toString(),JSON.stringify(result)]);
  if(!r.rows[0]){await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action) VALUES($1,$2,$3,$4,'FENCED')`,[claim.scope,claim.operationKey,claim.ownerId,claim.fencingToken.toString()]);throw new Error('EXECUTION_CLAIM_FENCED');}
  await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action,metadata_json) VALUES($1,$2,$3,$4,'SUCCEEDED',$5::jsonb)`,[claim.scope,claim.operationKey,claim.ownerId,claim.fencingToken.toString(),JSON.stringify({})]);
}
export async function failExecutionClaimTx(tx:SqlExecutor,claim:ExecutionClaim,errorCode:string){
  await tx.query(`UPDATE trust_execution_claims SET status='FAILED',last_error=$5,lease_expires_at=now(),updated_at=now() WHERE scope=$1 AND operation_key=$2 AND owner_id=$3 AND fencing_token=$4 AND status='RUNNING'`,[claim.scope,claim.operationKey,claim.ownerId,claim.fencingToken.toString(),errorCode.slice(0,2000)]);
  await tx.query(`INSERT INTO trust_execution_claim_events(scope,operation_key,owner_id,fencing_token,action,metadata_json) VALUES($1,$2,$3,$4,'FAILED',$5::jsonb)`,[claim.scope,claim.operationKey,claim.ownerId,claim.fencingToken.toString(),JSON.stringify({errorCode})]);
}
