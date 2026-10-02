import { createHash } from 'node:crypto';
export type CommandEnvelope={commandId:string;tenantId:string;actorId:string;name:string;version:number;payload:unknown;causationId?:string;correlationId:string};
export function commandFingerprint(c:CommandEnvelope){return createHash('sha256').update(JSON.stringify({tenantId:c.tenantId,actorId:c.actorId,name:c.name,version:c.version,payload:c.payload})).digest('hex');}
export function assertCommandIdentity(c:CommandEnvelope){if(!c.commandId||!c.tenantId||!c.actorId||!c.correlationId)throw new Error('COMMAND_IDENTITY_REQUIRED');if(c.version<1)throw new Error('COMMAND_VERSION_INVALID');return commandFingerprint(c);}
