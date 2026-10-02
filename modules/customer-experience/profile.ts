import { randomUUID } from 'node:crypto';
import { query } from '../platform/db/postgres';
import { appendAuditTrail, appendTimeline, normalizeCountry, normalizeLocale, normalizeOptionalText, normalizeText, normalizeTimezone, transaction } from './helpers';
import type { CustomerAddress, CustomerProfile } from './contracts';

export async function getProfile(customerId:string):Promise<CustomerProfile|null>{
 const r=await query<CustomerProfile>(`select id,email,display_name as "displayName",phone,locale,timezone,lifecycle,marketing_opt_in as "marketingOptIn",personalization_opt_in as "personalizationOptIn",created_at as "createdAt",updated_at as "updatedAt" from trust_customer_profiles where id=$1`,[customerId]); return r.rows[0]??null;
}
export async function ensureProfile(customerId:string,email:string){
 await query(`insert into trust_customer_profiles(id,email,lifecycle,locale,timezone,marketing_opt_in,personalization_opt_in,created_at,updated_at) values($1,$2,'ACTIVE','en','UTC',false,false,now(),now()) on conflict(id) do update set email=excluded.email,updated_at=now()`,[customerId,email]);
 return getProfile(customerId);
}
export async function updateProfile(customerId:string,input:Record<string,unknown>){
 const displayName=normalizeOptionalText(input.displayName,120); const phone=normalizeOptionalText(input.phone,40); const locale=normalizeLocale(input.locale); const timezone=normalizeTimezone(input.timezone);
 const r=await query<CustomerProfile>(`update trust_customer_profiles set display_name=$2,phone=$3,locale=$4,timezone=$5,updated_at=now() where id=$1 and lifecycle='ACTIVE' returning id,email,display_name as "displayName",phone,locale,timezone,lifecycle,marketing_opt_in as "marketingOptIn",personalization_opt_in as "personalizationOptIn",created_at as "createdAt",updated_at as "updatedAt"`,[customerId,displayName,phone,locale,timezone]);
 if(!r.rows[0]) throw new Error('PROFILE_NOT_FOUND_OR_INACTIVE');
 await appendTimeline({customerId,kind:'PROFILE',entityType:'customer_profile',entityId:customerId,action:'PROFILE_UPDATED',summary:'Customer profile updated',metadata:{fields:['displayName','phone','locale','timezone']}});
 await appendAuditTrail({customerId,action:'PROFILE_UPDATED',entityType:'customer_profile',entityId:customerId}); return r.rows[0];
}
export async function setLifecycle(customerId:string,lifecycle:'ACTIVE'|'SUSPENDED'|'PENDING_DELETION'){
 const r=await query(`update trust_customer_profiles set lifecycle=$2,updated_at=now() where id=$1 and lifecycle<>'DELETED' returning id,lifecycle`,[customerId,lifecycle]); if(!r.rows[0]) throw new Error('PROFILE_NOT_FOUND');
 await appendTimeline({customerId,kind:'PROFILE',entityType:'customer_profile',entityId:customerId,action:`LIFECYCLE_${lifecycle}`,summary:`Customer lifecycle changed to ${lifecycle}`}); return r.rows[0];
}
export async function listAddresses(customerId:string,kind?:string){
 const params=[customerId]; let where='customer_id=$1'; if(kind){params.push(kind);where+=' and kind=$2'}
 const r=await query<CustomerAddress>(`select id,customer_id as "customerId",kind,label,recipient_name as "recipientName",line1,line2,city,region,postal_code as "postalCode",country_code as "countryCode",phone,is_default as "isDefault",created_at as "createdAt",updated_at as "updatedAt" from trust_customer_addresses where ${where} order by is_default desc,created_at desc`,params); return r.rows;
}
export async function createAddress(customerId:string,input:Record<string,unknown>):Promise<CustomerAddress>{
 const count=await query<{count:string}>(`select count(*)::text as count from trust_customer_addresses where customer_id=$1`,[customerId]); if(Number(count.rows[0]?.count??0)>=20) throw new Error('ADDRESS_LIMIT_REACHED');
 const id=randomUUID(); const kind=String(input.kind??'SHIPPING'); if(kind!=='SHIPPING'&&kind!=='BILLING') throw new Error('INVALID_ADDRESS_KIND');
 const recipientName=normalizeText(input.recipientName,160); const line1=normalizeText(input.line1,240); const line2=normalizeOptionalText(input.line2,240); const city=normalizeText(input.city,120); const region=normalizeOptionalText(input.region,120); const postal=normalizeOptionalText(input.postalCode,40); const country=normalizeCountry(input.countryCode); const label=normalizeText(input.label,80)||'Address'; const phone=normalizeOptionalText(input.phone,40); if(!recipientName||!line1||!city||country.length!==2) throw new Error('INVALID_ADDRESS');
 return transaction(async client=>{
  const owner=await client.query(`select id from trust_customer_profiles where id=$1 and lifecycle='ACTIVE' for update`,[customerId]);
  if(!owner.rows[0]) throw new Error('PROFILE_NOT_FOUND_OR_INACTIVE');
  const makeDefault=Boolean(input.isDefault);
  if(makeDefault) await client.query(`update trust_customer_addresses set is_default=false,updated_at=now() where customer_id=$1 and kind=$2`,[customerId,kind]);
  const r=await client.query<CustomerAddress>(`insert into trust_customer_addresses(id,customer_id,kind,label,recipient_name,line1,line2,city,region,postal_code,country_code,phone,is_default,created_at,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now()) returning id,customer_id as "customerId",kind,label,recipient_name as "recipientName",line1,line2,city,region,postal_code as "postalCode",country_code as "countryCode",phone,is_default as "isDefault",created_at as "createdAt",updated_at as "updatedAt"`,[id,customerId,kind,label,recipientName,line1,line2,city,region,postal,country,phone,makeDefault]);
  await appendTimeline({customerId,kind:'PROFILE',entityType:'customer_address',entityId:id,action:'ADDRESS_CREATED',summary:'Customer address added',metadata:{kind,isDefault:makeDefault}},client); await appendAuditTrail({customerId,action:'ADDRESS_CREATED',entityType:'customer_address',entityId:id},client); return r.rows[0];
 });
}
export async function updateAddress(customerId:string,addressId:string,input:Record<string,unknown>){
 const existing=await query<{kind:string}>(`select kind from trust_customer_addresses where id=$1 and customer_id=$2`,[addressId,customerId]); if(!existing.rows[0]) throw new Error('ADDRESS_NOT_FOUND');
 const kind=String(input.kind??existing.rows[0].kind); if(kind!=='SHIPPING'&&kind!=='BILLING') throw new Error('INVALID_ADDRESS_KIND');
 const fields={label:normalizeText(input.label,80)||'Address',recipientName:normalizeText(input.recipientName,160),line1:normalizeText(input.line1,240),line2:normalizeOptionalText(input.line2,240),city:normalizeText(input.city,120),region:normalizeOptionalText(input.region,120),postalCode:normalizeOptionalText(input.postalCode,40),countryCode:normalizeCountry(input.countryCode),phone:normalizeOptionalText(input.phone,40)}; if(!fields.recipientName||!fields.line1||!fields.city||fields.countryCode.length!==2) throw new Error('INVALID_ADDRESS');
 return transaction(async client=>{if(Boolean(input.isDefault)) await client.query(`update trust_customer_addresses set is_default=false,updated_at=now() where customer_id=$1 and kind=$2`,[customerId,kind]); const r=await client.query(`update trust_customer_addresses set kind=$3,label=$4,recipient_name=$5,line1=$6,line2=$7,city=$8,region=$9,postal_code=$10,country_code=$11,phone=$12,is_default=$13,updated_at=now() where id=$1 and customer_id=$2 returning id,kind`,[addressId,customerId,kind,fields.label,fields.recipientName,fields.line1,fields.line2,fields.city,fields.region,fields.postalCode,fields.countryCode,fields.phone,Boolean(input.isDefault)]); if(!r.rows[0]) throw new Error('ADDRESS_UPDATE_FAILED'); await appendTimeline({customerId,kind:'PROFILE',entityType:'customer_address',entityId:addressId,action:'ADDRESS_UPDATED',summary:'Customer address updated'},client); return r.rows[0];});
}
export async function deleteAddress(customerId:string,addressId:string){
 return transaction(async client=>{const r=await client.query(`delete from trust_customer_addresses where id=$1 and customer_id=$2 returning id,is_default as "isDefault",kind`,[addressId,customerId]); if(!r.rows[0]) throw new Error('ADDRESS_NOT_FOUND'); if(r.rows[0].isDefault) await client.query(`update trust_customer_addresses set is_default=true where id=(select id from trust_customer_addresses where customer_id=$1 and kind=$2 order by created_at desc limit 1)`,[customerId,r.rows[0].kind]); await appendTimeline({customerId,kind:'PROFILE',entityType:'customer_address',entityId:addressId,action:'ADDRESS_DELETED',summary:'Customer address deleted'},client); return {deleted:true,id:addressId};});
}
export async function setDefaultAddress(customerId:string,addressId:string){
 return transaction(async client=>{const a=await client.query<{kind:string}>(`select kind from trust_customer_addresses where id=$1 and customer_id=$2`,[addressId,customerId]); if(!a.rows[0]) throw new Error('ADDRESS_NOT_FOUND'); await client.query(`update trust_customer_addresses set is_default=false,updated_at=now() where customer_id=$1 and kind=$2`,[customerId,a.rows[0].kind]); const r=await client.query(`update trust_customer_addresses set is_default=true,updated_at=now() where id=$1 and customer_id=$2 returning id,kind`,[addressId,customerId]); await appendTimeline({customerId,kind:'PROFILE',entityType:'customer_address',entityId:addressId,action:'ADDRESS_DEFAULTED',summary:'Customer default address changed'},client); return r.rows[0];});
}
