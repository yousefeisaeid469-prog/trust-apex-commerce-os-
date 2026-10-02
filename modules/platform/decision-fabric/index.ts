import { createHash } from 'node:crypto';

export type EvidenceKind = 'PRICE'|'SELLER'|'AUTHENTICITY'|'DELIVERY'|'WARRANTY'|'RETURNS'|'PAYMENT'|'INVENTORY'|'CUSTOMER'|'SYSTEM';
export type EvidenceStatus = 'VERIFIED'|'UNVERIFIED'|'CONTRADICTED'|'EXPIRED'|'MISSING';
export type EvidenceTrustLevel = 'SYSTEM'|'PROVIDER'|'USER'|'UNVERIFIED';
export type DecisionRisk = 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type DecisionOutcome = 'ALLOW'|'ASSIST'|'REVIEW'|'BLOCK'|'UNKNOWN';

export type Evidence = {
  id: string; kind: EvidenceKind; status: EvidenceStatus; source: string;
  observedAt: string; expiresAt?: string; confidence: number; claim: string;
  tenantId?: string; trustLevel?: EvidenceTrustLevel; sourceType?: string; providerId?: string;
  provenance?: { attestationId?: string; verifiedAt?: string; contentHash?: string };
};
export type DecisionRequest = { subjectId:string; action:string; region?:string; currency?:string; impact?:'LOW'|'MEDIUM'|'HIGH'; evidence:Evidence[]; tenantId?:string; actorId?:string; traceId?:string; };
export type Decision = { id:string; subjectId:string; action:string; outcome:DecisionOutcome; risk:DecisionRisk; confidence:number; rationale:string[]; missingEvidence:EvidenceKind[]; contradictions:Evidence[]; reversible:boolean; humanReviewRequired:boolean; createdAt:string; policyVersion:string; evidenceHash:string; traceId:string; };

const POLICY_VERSION='v129.0';
const REQUIRED:EvidenceKind[]=['PRICE','SELLER','AUTHENTICITY','DELIVERY','RETURNS','PAYMENT'];
const now=()=>new Date().toISOString();
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const allowedKinds=new Set<EvidenceKind>(['PRICE','SELLER','AUTHENTICITY','DELIVERY','WARRANTY','RETURNS','PAYMENT','INVENTORY','CUSTOMER','SYSTEM']);
const allowedStatuses=new Set<EvidenceStatus>(['VERIFIED','UNVERIFIED','CONTRADICTED','EXPIRED','MISSING']);

export function validateEvidence(evidence:unknown[], expectedTenant='default', options:{trustedIngress?:boolean}={}):Evidence[]{
  if(!Array.isArray(evidence)||evidence.length>100)throw new Error('INVALID_EVIDENCE_SET');
  return evidence.map((raw:any,index)=>{
    if(!raw||typeof raw!=='object')throw new Error(`INVALID_EVIDENCE_${index}`);
    if(typeof raw.id!=='string'||raw.id.length<3||raw.id.length>160)throw new Error(`INVALID_EVIDENCE_ID_${index}`);
    if(!allowedKinds.has(raw.kind))throw new Error(`INVALID_EVIDENCE_KIND_${index}`);
    if(!allowedStatuses.has(raw.status))throw new Error(`INVALID_EVIDENCE_STATUS_${index}`);
    if(typeof raw.source!=='string'||raw.source.trim().length<2||raw.source.length>240)throw new Error(`INVALID_EVIDENCE_SOURCE_${index}`);
    if(typeof raw.claim!=='string'||raw.claim.trim().length<2||raw.claim.length>2000)throw new Error(`INVALID_EVIDENCE_CLAIM_${index}`);
    const observed=new Date(raw.observedAt); if(Number.isNaN(observed.getTime()))throw new Error(`INVALID_EVIDENCE_TIMESTAMP_${index}`);
    if(raw.expiresAt && Number.isNaN(new Date(raw.expiresAt).getTime()))throw new Error(`INVALID_EVIDENCE_EXPIRY_${index}`);
    const confidence=Number(raw.confidence); if(!Number.isFinite(confidence)||confidence<0||confidence>1)throw new Error(`INVALID_EVIDENCE_CONFIDENCE_${index}`);
    const tenantId=typeof raw.tenantId==='string'&&raw.tenantId.trim()?raw.tenantId.trim():expectedTenant;
    if(tenantId!==expectedTenant)throw new Error('EVIDENCE_TENANT_MISMATCH');
    const trustLevel=(raw.trustLevel??'USER') as EvidenceTrustLevel;
    if(!['SYSTEM','PROVIDER','USER','UNVERIFIED'].includes(trustLevel))throw new Error(`INVALID_EVIDENCE_TRUST_${index}`);
    const provenance=raw.provenance&&typeof raw.provenance==='object'?raw.provenance:{};
    const attested=(options.trustedIngress===true && trustLevel==='SYSTEM') || (options.trustedIngress===true && trustLevel==='PROVIDER' && typeof raw.providerId==='string' && typeof provenance.attestationId==='string' && typeof provenance.verifiedAt==='string');
    // Client-submitted claims are never allowed to self-attest as verified.
    if(raw.status==='VERIFIED'&&!attested) return {...raw,status:'UNVERIFIED',confidence:Math.min(confidence,.49),tenantId,trustLevel:'UNVERIFIED'} as Evidence;
    if(trustLevel==='SYSTEM' && options.trustedIngress!==true) return {...raw,status:raw.status==='CONTRADICTED'?'CONTRADICTED':'UNVERIFIED',confidence:Math.min(confidence,.49),tenantId,trustLevel:'UNVERIFIED'} as Evidence;
    return {...raw,confidence,tenantId,trustLevel,provenance} as Evidence;
  });
}

export function evidenceContentHash(evidence:Evidence[]){return createHash('sha256').update(JSON.stringify(evidence.map(e=>({id:e.id,kind:e.kind,status:e.status,source:e.source,observedAt:e.observedAt,expiresAt:e.expiresAt??null,confidence:e.confidence,claim:e.claim,tenantId:e.tenantId??'default',trustLevel:e.trustLevel??'UNVERIFIED',providerId:e.providerId??null,provenance:e.provenance??{}})).sort((a,b)=>a.id.localeCompare(b.id)))).digest('hex');}

export function evaluateDecision(req:DecisionRequest):Decision{
  const evidence=req.evidence||[];
  const missing=REQUIRED.filter(k=>!evidence.some(e=>e.kind===k&&e.status==='VERIFIED'));
  const contradictions=evidence.filter(e=>e.status==='CONTRADICTED');
  const verified=evidence.filter(e=>e.status==='VERIFIED');
  const avg=verified.length?verified.reduce((s,e)=>s+clamp(e.confidence),0)/verified.length:0;
  const providerWeak=verified.filter(e=>e.trustLevel!=='SYSTEM'&&e.trustLevel!=='PROVIDER').length;
  const expired=evidence.filter(e=>e.expiresAt&&Date.parse(e.expiresAt)<=Date.now()).length;
  const riskScore=Math.min(1,contradictions.length*.30+missing.length*.08+(1-avg)*.48+(req.impact==='HIGH'?.10:0)+providerWeak*.08+expired*.05);
  const risk:DecisionRisk=riskScore>=.82?'CRITICAL':riskScore>=.62?'HIGH':riskScore>=.35?'MEDIUM':'LOW';
  const confidence=clamp(verified.length?avg*(1-Math.min(.45,missing.length*.04)):0);
  let outcome:DecisionOutcome='UNKNOWN';
  if(contradictions.length||risk==='CRITICAL')outcome='BLOCK';
  else if(req.impact==='HIGH'||risk==='HIGH')outcome='REVIEW';
  else if(missing.length)outcome='ASSIST';
  else outcome='ALLOW';
  const rationale=[`Policy ${POLICY_VERSION}`,`Verified evidence: ${verified.length}`,`Missing required evidence: ${missing.length}`,`Contradictions: ${contradictions.length}`,`Evidence confidence: ${Math.round(confidence*100)}%`,`Expired evidence: ${expired}`,'Unknown data is preserved as unknown; no positive claim is inferred from absence.'];
  return {id:`df_${crypto.randomUUID()}`,subjectId:req.subjectId,action:req.action,outcome,risk,confidence,rationale,missingEvidence:missing,contradictions,reversible:outcome!=='BLOCK',humanReviewRequired:outcome==='REVIEW'||outcome==='BLOCK',createdAt:now(),policyVersion:POLICY_VERSION,evidenceHash:evidenceContentHash(evidence),traceId:req.traceId??crypto.randomUUID()};
}

export function buildEvidenceChain(subjectId:string):Evidence[]{const t=now();return[
{id:`ev_${subjectId}_price`,kind:'PRICE',status:'VERIFIED',source:'price-history.contract',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:t,confidence:.91,claim:'Reference price evidence is available.'},
{id:`ev_${subjectId}_seller`,kind:'SELLER',status:'VERIFIED',source:'seller-profile.contract',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:t,confidence:.88,claim:'Seller identity and status evidence is available.'},
{id:`ev_${subjectId}_auth`,kind:'AUTHENTICITY',status:'UNVERIFIED',source:'authenticity.provider',sourceType:'PROVIDER',observedAt:t,confidence:.12,claim:'Authenticity provider is not connected.'},
{id:`ev_${subjectId}_delivery`,kind:'DELIVERY',status:'VERIFIED',source:'logistics.quote.contract',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:t,confidence:.84,claim:'Delivery estimate is provider-backed when available.'},
{id:`ev_${subjectId}_returns`,kind:'RETURNS',status:'VERIFIED',source:'merchant-policy.contract',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:t,confidence:.86,claim:'Return policy evidence is available.'},
{id:`ev_${subjectId}_payment`,kind:'PAYMENT',status:'VERIFIED',source:'payment-orchestrator.contract',sourceType:'SYSTEM',trustLevel:'SYSTEM',observedAt:t,confidence:.9,claim:'Payment state contract is available.'}
];}
export function fabricSnapshot(){return{version:'134.0.0',mode:'durable-evidence-first',providersConnected:false,capabilities:['validated-provenance','provider-attestation-boundaries','contradiction-detection','policy-versioning','risk-scoring','human-review-gates','durable-decision-ledger','hash-linked-audit','transactional-outbox'],policy:{unknownIsUnknown:true,financialAutoActions:false,highImpactReview:true,clientClaimsCannotSelfVerify:true},generatedAt:now()};}
