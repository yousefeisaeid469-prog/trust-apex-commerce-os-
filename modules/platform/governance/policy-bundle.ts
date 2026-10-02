import { createHash } from 'node:crypto';
export type PolicyBundle={version:number;rules:readonly{id:string;effect:'allow'|'deny';actions:readonly string[];roles?:readonly string[]}[]};
function canonical(bundle:PolicyBundle){return JSON.stringify({version:bundle.version,rules:[...bundle.rules].map(r=>({id:r.id,effect:r.effect,actions:[...r.actions].sort(),roles:[...(r.roles??[])].sort()})).sort((a,b)=>a.id.localeCompare(b.id))});}
export function fingerprint(bundle:PolicyBundle){return createHash('sha256').update(canonical(bundle)).digest('hex');}
export function validatePolicyBundle(bundle:PolicyBundle){if(!Number.isInteger(bundle.version)||bundle.version<1)throw new Error('INVALID_POLICY_VERSION');const ids=new Set<string>();for(const rule of bundle.rules){if(!rule.id||ids.has(rule.id))throw new Error('DUPLICATE_POLICY_RULE');ids.add(rule.id);if(!rule.actions.length)throw new Error('EMPTY_POLICY_ACTIONS');}}
