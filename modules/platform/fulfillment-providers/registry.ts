import { createHttpFulfillmentAdapter } from './http-adapter';
import type { FulfillmentProviderAdapter, ProviderEnvironment } from './contracts';

function envKey(provider:string,suffix:string){return `FULFILLMENT_${provider.replace(/[^A-Za-z0-9]/g,'_').toUpperCase()}_${suffix}`;}
export function providerEnvironment():ProviderEnvironment{return process.env.TRUST_ENVIRONMENT==='live'?'LIVE':'SANDBOX'};
export function getFulfillmentProvider(provider:string):FulfillmentProviderAdapter{
  const name=provider.trim();
  if(!name)throw new Error('PROVIDER_REQUIRED');
  const prefix=envKey(name,'');
  return createHttpFulfillmentAdapter(name,providerEnvironment(),{baseUrl:process.env[`${prefix}BASE_URL`],secret:process.env[`${prefix}SECRET`]});
}
export function providerWebhookSecret(provider:string){return process.env[envKey(provider,'WEBHOOK_SECRET')];}
