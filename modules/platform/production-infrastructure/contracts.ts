export interface HttpTransport { request(i:{method:string;url:string;headers?:Record<string,string>;body?:string;signal?:AbortSignal}):Promise<{status:number;headers:Record<string,string>;body:string}> }
export interface DeploymentLock { acquire(key:string,owner:string,ttlMs:number):Promise<boolean>; release(key:string,owner:string):Promise<void> }
export interface IdempotencyStore { get(key:string):Promise<string|null>; put(key:string,value:string,ttlMs:number):Promise<void> }
export interface InfrastructureTarget { namespace:string; workload:string; container:string; image:string; replicas:number }
export interface TrafficTarget { service:string; weightPct:number }
export interface ProductionInfrastructureAdapter { preflight(t:InfrastructureTarget):Promise<boolean>; deploy(t:InfrastructureTarget):Promise<{revision:string}>; shiftTraffic(t:TrafficTarget):Promise<boolean>; promote(service:string):Promise<boolean>; rollback(service:string):Promise<boolean>; verify(service:string):Promise<boolean> }
