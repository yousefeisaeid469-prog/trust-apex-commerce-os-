import { createHash } from 'node:crypto';
import { paymentAdapters } from '../global-commerce-v297/payments.ts';
import type { PaymentCapability } from '../global-commerce-v297/contracts.ts';
import { getCapability, assertSettlementCurrency } from '../global-commerce-v297/registry.ts';
export const GLOBAL_PAYMENT_RUNTIME_VERSION = 'V299.0.0';

export type GlobalPaymentMethod = 'card'|'cod'|'wallet'|'bank_transfer';
const capabilityFor: Record<GlobalPaymentMethod, PaymentCapability> = {
  card: 'CARD', cod: 'COD', wallet: 'WALLET', bank_transfer: 'BANK_TRANSFER'
};
const normalize = (v:string) => v.trim().toLowerCase().replace(/-/g,'_') as GlobalPaymentMethod;
const hash = (scope:string,value:unknown) => createHash('sha256').update(`${scope}:${JSON.stringify(value)}`).digest('hex');

export function assertGlobalPaymentCapability(input:{country:string;currency:string;method:string;provider:string}) {
  const country = input.country.trim().toUpperCase() as any;
  const currency = input.currency.trim().toUpperCase() as any;
  const method = normalize(input.method);
  const capability = capabilityFor[method];
  if (!capability) throw new Error('GLOBAL_PAYMENT_METHOD_UNSUPPORTED');
  const c = getCapability(country);
  assertSettlementCurrency(currency,c.country);
  const adapter = paymentAdapters(country,currency).find(a => a.capability === capability && a.provider === input.provider.trim());
  if (!adapter) throw new Error('GLOBAL_PAYMENT_PROVIDER_NOT_AVAILABLE');
  return { country:c.country, currency, method, capability, adapter };
}

export function globalPaymentRequestHash(input:unknown) { return hash('global-payment',input); }
