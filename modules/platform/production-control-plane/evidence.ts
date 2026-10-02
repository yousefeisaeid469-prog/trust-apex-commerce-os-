import crypto from 'node:crypto';
import type {DeploymentIntent,DeploymentRecord,TelemetrySignal} from './contracts.ts';
const stable=(x:unknown):unknown=>{if(Array.isArray(x))return x.map(stable);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));return x};
export function evidenceHash(intent:DeploymentIntent,record:DeploymentRecord,signals:TelemetrySignal[]){const body=JSON.stringify(stable({version:'V150.0.0',intent,record,signals:signals.map(stable)}));return crypto.createHash('sha256').update(body).digest('hex')}
