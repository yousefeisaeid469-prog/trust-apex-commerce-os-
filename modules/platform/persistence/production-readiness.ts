import { query } from '../db/postgres';

export type ProductionDependency='database'|'auth'|'payments'|'storage'|'email'|'observability';
export type DependencyState={name:ProductionDependency;configured:boolean;requiredForLaunch:boolean;keys:string[]};

const envMap:Record<ProductionDependency,string[]>= {
  database:['DATABASE_URL'],
  auth:['TRUST_SESSION_SECRET'],
  payments:['TRUST_WEBHOOK_SECRET'],
  storage:['STORAGE_BUCKET'],
  email:['EMAIL_PROVIDER_API_KEY'],
  observability:['OBSERVABILITY_DSN'],
};

export async function productionReadiness(input:Record<string,string|undefined>=process.env){
  const dependencies=(Object.entries(envMap) as [ProductionDependency,string[]][]).map(([name,keys])=>({
    name,keys,configured:keys.every(k=>Boolean(input[k])),requiredForLaunch:['database','auth'].includes(name)
  }));
  const checks:{name:string;ok:boolean;detail?:string}[]=[];
  if(input.DATABASE_URL){
    try{
      const r=await query<{ok:number}>('select 1 as ok');
      checks.push({name:'database-connectivity',ok:Number(r.rows[0]?.ok)===1});
    }catch(error){checks.push({name:'database-connectivity',ok:false,detail:error instanceof Error?error.message:'unknown'});}
  } else checks.push({name:'database-connectivity',ok:false,detail:'DATABASE_URL missing'});
  const ready=dependencies.filter(d=>d.requiredForLaunch).every(d=>d.configured) && checks.every(c=>c.ok);
  return {ready,dependencies,checks,generatedAt:new Date().toISOString()};
}
