export type ProviderEnvironment='SANDBOX'|'LIVE';
export type ProviderCapability='PAYMENT_AUTHORIZE'|'PAYMENT_CAPTURE'|'PAYMENT_REFUND'|'FULFILLMENT_CREATE'|'FULFILLMENT_TRACK'|'SUPPORT_CASE';
export type ProviderCertificationStatus='UNVERIFIED'|'PASSED'|'FAILED'|'EXPIRED';
export type ProviderHealthStatus='UNKNOWN'|'HEALTHY'|'DEGRADED'|'DOWN';
export interface ProviderRegistration { provider:string; adapter:string; environment:ProviderEnvironment; capabilities:ProviderCapability[]; certification:ProviderCertificationStatus; health:ProviderHealthStatus; certifiedAt?:string; expiresAt?:string; lastHealthCheckAt?:string; }
export interface ProviderReadiness { ready:boolean; provider:string; adapter:string; capability:ProviderCapability; environment:ProviderEnvironment; reason:string; }
export interface ProviderCapabilityStore { query<T=unknown>(sql:string,params?:readonly unknown[]):Promise<{rows:T[]}>; }
