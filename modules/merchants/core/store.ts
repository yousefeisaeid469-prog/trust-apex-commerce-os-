import { query, withPgTransaction } from '../../platform/db/postgres';
import { getUserById, updateUser } from '../../platform/auth/store';

export interface MerchantProfile { id:string; userId:string; storeName:string; slug:string; verificationStatus:'pending'|'verified'|'rejected'; createdAt:string; }
function mapRow(r:any):MerchantProfile{return{id:String(r.id),userId:String(r.user_id),storeName:String(r.store_name),slug:String(r.slug),verificationStatus:r.verification_status,createdAt:new Date(r.created_at).toISOString()};}
function slugify(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||`store-${crypto.randomUUID().slice(0,8)}`;}
export async function createMerchantProfile(userId:string,storeName:string){
  const user=await getUserById(userId); if(!user)throw new Error('USER_NOT_FOUND');
  const cleanName=storeName.trim(); if(cleanName.length<2||cleanName.length>80)throw new Error('INVALID_STORE_NAME');
  return withPgTransaction(async client=>{
    const existing=await client.query(`select id,user_id,store_name,slug,verification_status,created_at from trust_merchant_profiles where user_id=$1 for update`,[userId]);
    if(existing.rows[0]) return mapRow(existing.rows[0]);
    let slug=slugify(cleanName);
    for(let i=0;i<5;i++){
      try{
        const result=await client.query(`insert into trust_merchant_profiles(user_id,store_name,slug) values($1,$2,$3) returning id,user_id,store_name,slug,verification_status,created_at`,[userId,cleanName,slug]);
        const profile=mapRow(result.rows[0]);
        await client.query(`update trust_users set role='merchant',merchant_id=$1,updated_at=now() where id=$2`,[profile.id,userId]);
        return profile;
      }catch(error:any){if(error?.code!=='23505'||!String(error?.constraint??'').includes('slug'))throw error;slug=`${slugify(cleanName)}-${i+2}`;}
    }
    throw new Error('MERCHANT_SLUG_UNAVAILABLE');
  });
}
export async function getMerchantByUserId(userId:string){const result=await query(`select id,user_id,store_name,slug,verification_status,created_at from trust_merchant_profiles where user_id=$1 limit 1`,[userId]);return result.rows[0]?mapRow(result.rows[0]):undefined;}
export async function getMerchantById(id:string){const result=await query(`select id,user_id,store_name,slug,verification_status,created_at from trust_merchant_profiles where id=$1 limit 1`,[id]);return result.rows[0]?mapRow(result.rows[0]):undefined;}

export interface MerchantVerificationRequest {
  id:string; merchantId:string; legalName:string; nationalIdNumber:string; commercialRegistryNumber:string|null;
  phoneNumber:string; idDocumentUrl:string; registryDocumentUrl:string|null;
  status:'submitted'|'approved'|'rejected'; reviewerEmail:string|null; reviewedAt:string|null; rejectionReason:string|null; createdAt:string;
}
function mapVerificationRow(r:any):MerchantVerificationRequest{return{id:String(r.id),merchantId:String(r.merchant_id),legalName:String(r.legal_name),nationalIdNumber:String(r.national_id_number),commercialRegistryNumber:r.commercial_registry_number,phoneNumber:String(r.phone_number),idDocumentUrl:String(r.id_document_url),registryDocumentUrl:r.registry_document_url,status:r.status,reviewerEmail:r.reviewer_email,reviewedAt:r.reviewed_at?new Date(r.reviewed_at).toISOString():null,rejectionReason:r.rejection_reason,createdAt:new Date(r.created_at).toISOString()};}

const NATIONAL_ID_RE=/^\d{14}$/; // Egyptian national ID: 14 digits
const PHONE_RE=/^01[0125]\d{8}$/; // Egyptian mobile format

export async function submitMerchantVerification(userId:string,input:{legalName:string;nationalIdNumber:string;commercialRegistryNumber?:string;phoneNumber:string;idDocumentUrl:string;registryDocumentUrl?:string}){
  const merchant=await getMerchantByUserId(userId); if(!merchant)throw new Error('MERCHANT_PROFILE_REQUIRED');
  if(merchant.verificationStatus==='verified')throw new Error('ALREADY_VERIFIED');
  const legalName=input.legalName.trim(); if(legalName.length<3||legalName.length>120)throw new Error('INVALID_LEGAL_NAME');
  const nationalIdNumber=input.nationalIdNumber.trim(); if(!NATIONAL_ID_RE.test(nationalIdNumber))throw new Error('INVALID_NATIONAL_ID');
  const phoneNumber=input.phoneNumber.trim(); if(!PHONE_RE.test(phoneNumber))throw new Error('INVALID_PHONE_NUMBER');
  if(!input.idDocumentUrl || !/^https:\/\//.test(input.idDocumentUrl))throw new Error('ID_DOCUMENT_REQUIRED');
  return withPgTransaction(async client=>{
    const pending=await client.query(`select id from trust_merchant_verification_requests where merchant_id=$1 and status='submitted' for update`,[merchant.id]);
    if(pending.rows[0])throw new Error('VERIFICATION_ALREADY_PENDING');
    const result=await client.query(
      `insert into trust_merchant_verification_requests(merchant_id,legal_name,national_id_number,commercial_registry_number,phone_number,id_document_url,registry_document_url)
       values($1,$2,$3,$4,$5,$6,$7) returning *`,
      [merchant.id,legalName,nationalIdNumber,input.commercialRegistryNumber?.trim()||null,phoneNumber,input.idDocumentUrl,input.registryDocumentUrl||null]
    );
    return mapVerificationRow(result.rows[0]);
  });
}

export async function getLatestVerificationRequest(merchantId:string){
  const result=await query(`select id,merchant_id,legal_name,national_id_number,commercial_registry_number,phone_number,id_document_url,registry_document_url,status,reviewer_email,reviewed_at,rejection_reason,created_at,updated_at from trust_merchant_verification_requests where merchant_id=$1 order by created_at desc limit 1`,[merchantId]);
  return result.rows[0]?mapVerificationRow(result.rows[0]):undefined;
}

export async function listPendingVerificationRequests(limit=50){
  const result=await query(
    `select v.*, m.store_name from trust_merchant_verification_requests v
     join trust_merchant_profiles m on m.id=v.merchant_id
     where v.status='submitted' order by v.created_at asc limit $1`,[limit]);
  return result.rows.map(r=>({...mapVerificationRow(r),storeName:String(r.store_name)}));
}

export async function reviewMerchantVerification(requestId:string,reviewerEmail:string,decision:'approved'|'rejected',rejectionReason?:string){
  if(decision==='rejected' && !rejectionReason?.trim())throw new Error('REJECTION_REASON_REQUIRED');
  return withPgTransaction(async client=>{
    const reqRow=await client.query(`select id,merchant_id,legal_name,national_id_number,commercial_registry_number,phone_number,id_document_url,registry_document_url,status,reviewer_email,reviewed_at,rejection_reason,created_at,updated_at from trust_merchant_verification_requests where id=$1 for update`,[requestId]);
    const request=reqRow.rows[0]; if(!request)throw new Error('VERIFICATION_REQUEST_NOT_FOUND');
    if(request.status!=='submitted')throw new Error('VERIFICATION_ALREADY_REVIEWED');
    await client.query(
      `update trust_merchant_verification_requests set status=$1,reviewer_email=$2,reviewed_at=now(),rejection_reason=$3,updated_at=now() where id=$4`,
      [decision,reviewerEmail,decision==='rejected'?rejectionReason!.trim():null,requestId]
    );
    await client.query(
      `update trust_merchant_profiles set verification_status=$1,updated_at=now() where id=$2`,
      [decision==='approved'?'verified':'rejected',request.merchant_id]
    );
    const updated=await client.query(`select id,merchant_id,legal_name,national_id_number,commercial_registry_number,phone_number,id_document_url,registry_document_url,status,reviewer_email,reviewed_at,rejection_reason,created_at,updated_at from trust_merchant_verification_requests where id=$1`,[requestId]);
    return mapVerificationRow(updated.rows[0]);
  });
}
