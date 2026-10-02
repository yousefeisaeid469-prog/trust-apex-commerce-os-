export type BootstrapComponent='postgres'|'kubernetes'|'traffic'|'telemetry'|'secrets'|'tls';
export interface BootstrapConfig { databaseUrl:string; kubernetesApi:string; trafficApi:string; otlpEndpoint:string; telemetryHealthUrl:string; requireTls:boolean; requiredComponents:BootstrapComponent[]; }
export interface ComponentProbe { component:BootstrapComponent; ok:boolean; latencyMs:number; detail:string; }
export interface BootstrapReport { version:string; ready:boolean; probes:ComponentProbe[]; generatedAt:string; evidenceHash:string; }
export interface BootstrapProbeClient { probe(component:BootstrapComponent):Promise<ComponentProbe>; }
