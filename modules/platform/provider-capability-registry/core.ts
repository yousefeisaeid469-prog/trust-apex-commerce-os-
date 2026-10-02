import type {ProviderCapability,ProviderEnvironment,ProviderReadiness,ProviderRegistration,ProviderCapabilityStore} from './contracts.ts';
const nonEmpty=(v:string,n:string)=>{if(!v||v.length>200)throw new Error(`${n}_REQUIRED`);return v;};
export function validateRegistration(r:ProviderRegistration):ProviderRegistration{
 nonEmpty(r.provider,'PROVIDER');nonEmpty(r.adapter,'ADAPTER');
 if(!['SANDBOX','LIVE'].includes(r.environment))throw new Error('ENVIRONMENT_INVALID');
 if(!Array.isArray(r.capabilities)||r.capabilities.length===0)throw new Error('CAPABILITIES_REQUIRED');
 if(!['UNVERIFIED','PASSED','FAILED','EXPIRED'].includes(r.certification))throw new Error('CERTIFICATION_INVALID');
 if(!['UNKNOWN','HEALTHY','DEGRADED','DOWN'].includes(r.health))throw new Error('HEALTH_INVALID');
 if(r.certifiedAt&&Number.isNaN(new Date(r.certifiedAt).getTime()))throw new Error('CERTIFIED_AT_INVALID');
 if(r.expiresAt&&Number.isNaN(new Date(r.expiresAt).getTime()))throw new Error('EXPIRES_AT_INVALID');
 return {...r,capabilities:[...new Set(r.capabilities)]};
}
export function assertProviderReady(r:ProviderRegistration,capability:ProviderCapability,now=new Date()):ProviderReadiness{
 const base={provider:r.provider,adapter:r.adapter,capability,environment:r.environment};
 if(!r.capabilities.includes(capability))return {...base,ready:false,reason:'CAPABILITY_NOT_REGISTERED'};
 if(r.certification!=='PASSED')return {...base,ready:false,reason:`CERTIFICATION_${r.certification}`};
 if(r.environment==='LIVE'&&r.health!=='HEALTHY')return {...base,ready:false,reason:`HEALTH_${r.health}`};
 if(r.expiresAt&&new Date(r.expiresAt)<=now)return {...base,ready:false,reason:'CERTIFICATION_EXPIRED'};
 return {...base,ready:true,reason:'PROVIDER_READY'};
}
export async function registerProvider(store:ProviderCapabilityStore,r:ProviderRegistration){const v=validateRegistration(r);await store.query(`insert into trust_provider_capabilities(provider,adapter,environment,capabilities_json,certification,health,certified_at,expires_at,last_health_check_at,updated_at) values($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,now()) on conflict(provider,environment) do update set adapter=excluded.adapter,capabilities_json=excluded.capabilities_json,certification=excluded.certification,health=excluded.health,certified_at=excluded.certified_at,expires_at=excluded.expires_at,last_health_check_at=excluded.last_health_check_at,updated_at=now()`,[v.provider,v.adapter,v.environment,JSON.stringify(v.capabilities),v.certification,v.health,v.certifiedAt||null,v.expiresAt||null,v.lastHealthCheckAt||null]);return v;}
export async function loadProvider(store:ProviderCapabilityStore,provider:string,environment:ProviderEnvironment):Promise<ProviderRegistration|null>{const r=await store.query<{provider:string;adapter:string;environment:ProviderEnvironment;capabilities_json:ProviderCapability[];certification:any;health:any;certified_at:string|null;expires_at:string|null;last_health_check_at:string|null}>(`select provider,adapter,environment,capabilities_json,certification,health,certified_at,expires_at,last_health_check_at from trust_provider_capabilities where provider=$1 and environment=$2`,[provider,environment]);const x=r.rows[0];return x?validateRegistration({provider:x.provider,adapter:x.adapter,environment:x.environment,capabilities:x.capabilities_json,certification:x.certification,health:x.health,certifiedAt:x.certified_at||undefined,expiresAt:x.expires_at||undefined,lastHealthCheckAt:x.last_health_check_at||undefined}):null;}
export async function checkProviderReady(store:ProviderCapabilityStore,input:{provider:string;environment:ProviderEnvironment;capability:ProviderCapability},now=new Date()){const r=await loadProvider(store,input.provider,input.environment);if(!r)return {ready:false,provider:input.provider,adapter:'',capability:input.capability,environment:input.environment,reason:'PROVIDER_NOT_REGISTERED'} as ProviderReadiness;return assertProviderReady(r,input.capability,now);}
