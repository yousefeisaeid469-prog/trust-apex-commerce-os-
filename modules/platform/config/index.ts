import {featureEnabled,type FeatureFlag} from './feature-flags';
export type PlatformFeature=FeatureFlag|'event_bus'|'workflow_engine'|'background_jobs'|'notifications'|'search_index';
const envKey=(name:string)=>`TRUST_PLATFORM_${name.toUpperCase()}`;
export function platformFeatureEnabled(flag:PlatformFeature,env:Record<string,string|undefined>=process.env){if(['event_bus','workflow_engine','background_jobs','notifications','search_index'].includes(flag))return ['1','true','yes','on'].includes((env[envKey(flag)]??'true').toLowerCase());return featureEnabled(flag as FeatureFlag,env)}
export function serverOnlySecret(name:string){if(typeof window!=='undefined')throw new Error('SERVER_ONLY_CONFIG');return process.env[name]??null}
export const platformConfig={version:'134.0.0',runtime:'TRUST APEX PLATFORM OS',secretBoundary:'server-only'};
