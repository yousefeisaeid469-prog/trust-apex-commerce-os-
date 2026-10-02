import { query, withPgTransaction } from '../platform/db/postgres';

export type SupportProblemType='DELIVERY'|'PAYMENT'|'PRODUCT'|'RETURN'|'ACCOUNT'|'OTHER';
export type SupportSeverity='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';

const allowedTypes=new Set<SupportProblemType>(['DELIVERY','PAYMENT','PRODUCT','RETURN','ACCOUNT','OTHER']);
const allowedSeverity=new Set<SupportSeverity>(['LOW','MEDIUM','HIGH','CRITICAL']);

export async function createSupportCase(input:{customerId:string;orderId?:string;problemType:string;severity?:string;description?:string}){
  const problemType=input.problemType as SupportProblemType;
  const severity=(input.severity??'MEDIUM') as SupportSeverity;
  if(!input.customerId?.trim()) throw new Error('CUSTOMER_REQUIRED');
  if(!allowedTypes.has(problemType)) throw new Error('INVALID_PROBLEM_TYPE');
  if(!allowedSeverity.has(severity)) throw new Error('INVALID_SEVERITY');
  const description=(input.description??'').trim().slice(0,2000);
  return withPgTransaction(async client=>{
    const result=await client.query(`insert into trust_problem_cases(customer_id,order_id,problem_type,severity,status,evidence_status,recommended_action) values($1,$2,$3,$4,'OPEN','NOT_REQUESTED',$5) returning id,customer_id,order_id,problem_type,severity,status,evidence_status,recommended_action,created_at`,[input.customerId.trim(),input.orderId?.trim()||null,problemType,severity,description||null]);
    const row=result.rows[0];
    await client.query(`insert into trust_problem_events(case_id,event_type,actor_type,payload) values($1,'CASE_CREATED','CUSTOMER',$2::jsonb)`,[row.id,JSON.stringify({description})]);
    return row;
  });
}

export async function listSupportCases(customerId:string){
  const result=await query(`select id,order_id,problem_type,severity,status,evidence_status,recommended_action,resolution_code,created_at,resolved_at from trust_problem_cases where customer_id=$1 order by created_at desc limit 50`,[customerId]);
  return result.rows;
}
