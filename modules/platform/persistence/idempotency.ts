import { createHash } from 'node:crypto';
export function normalizeIdempotencyKey(value:string|undefined){const key=(value??'').trim();if(!key||key.length>200)throw new Error('IDEMPOTENCY_KEY_REQUIRED');return key;}
export function requestFingerprint(scope:string,payload:unknown){return createHash('sha256').update(scope+'|'+stableJson(payload)).digest('hex');}
function stableJson(value:unknown):string{if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stableJson).join(',')+']';const obj=value as Record<string,unknown>;return '{'+Object.keys(obj).sort().map(k=>JSON.stringify(k)+':'+stableJson(obj[k])).join(',')+'}';}
