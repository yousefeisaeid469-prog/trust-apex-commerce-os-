export type Permission={action:string;resource:string};
export type SecurityEvent={type:string;actorId:string;tenantId:string;resource?:string;timestamp:string;metadata?:Record<string,string|number|boolean>};
export function authorize(input:{role:string;permissions:Permission[];required:Permission}):boolean{if(input.role==='system')return true;return input.permissions.some(p=>p.action===input.required.action&&p.resource===input.required.resource);}
export function securityEvent(input:Omit<SecurityEvent,'timestamp'>):SecurityEvent{return {...input,timestamp:new Date().toISOString()};}
export function rotateKey(currentVersion:number):{previousVersion:number;newVersion:number}{if(!Number.isInteger(currentVersion)||currentVersion<1)throw new Error('INVALID_KEY_VERSION');return {previousVersion:currentVersion,newVersion:currentVersion+1};}
