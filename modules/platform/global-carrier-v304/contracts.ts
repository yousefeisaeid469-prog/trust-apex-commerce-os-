export type CarrierCapability='CREATE_LABEL'|'TRACK'|'CANCEL_LABEL';
export type CarrierEnvironment='SANDBOX'|'LIVE';
export type CarrierMode='STANDARD'|'EXPRESS'|'PICKUP';
export type CircuitState='CLOSED'|'OPEN'|'HALF_OPEN';
export interface CarrierProfile { carrierCode:string; displayName:string; environment:CarrierEnvironment; enabled:boolean; capabilities:CarrierCapability[]; countries:string[]; currencies:string[]; }
export interface CarrierService { carrierCode:string; serviceCode:string; mode:CarrierMode; countries:string[]; minDays:number; maxDays:number; basePriceMinor:bigint; currency:string; enabled:boolean; }
export interface RouteCandidate { carrier:CarrierProfile; service:CarrierService; score:number; reasons:string[]; }
export interface RouteSelection { carrierCode:string; serviceCode:string; score:number; reasons:string[]; idempotencyKey:string; }
