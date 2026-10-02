import { createHttpPaymentAdapter } from './http-adapter';
import type { PaymentProviderAdapter, PaymentProviderEnvironment } from './contracts';

function envKey(provider: string, suffix: string) { return `PAYMENT_${provider.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}_${suffix}`; }
export function paymentProviderEnvironment(): PaymentProviderEnvironment { return process.env.TRUST_ENVIRONMENT === 'live' ? 'LIVE' : 'SANDBOX'; }
export function getPaymentProvider(provider: string): PaymentProviderAdapter {
  const name = provider.trim();
  if (!name) throw new Error('PROVIDER_REQUIRED');
  const prefix = envKey(name, '');
  return createHttpPaymentAdapter(name, paymentProviderEnvironment(), {
    baseUrl: process.env[`${prefix}BASE_URL`] ?? process.env.PAYMENTS_PROVIDER_BASE_URL,
    secret: process.env[`${prefix}SECRET`] ?? process.env.PAYMENTS_PROVIDER_SECRET
  });
}
