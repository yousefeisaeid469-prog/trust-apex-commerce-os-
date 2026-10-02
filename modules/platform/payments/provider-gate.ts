export type PaymentProviderReadiness = {
  configured: boolean;
  provider: string | null;
  environment: 'SANDBOX' | 'LIVE';
  reason?: 'PAYMENT_PROVIDER_NOT_CONFIGURED' | 'PAYMENT_PROVIDER_SECRET_NOT_CONFIGURED' | 'PAYMENT_PROVIDER_BASE_URL_NOT_CONFIGURED';
};

function envKey(provider: string, suffix: string) {
  return `PAYMENT_${provider.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}_${suffix}`;
}

export function getPaymentProviderReadiness(env: Record<string, string | undefined> = process.env): PaymentProviderReadiness {
  const provider = env.PAYMENT_PROVIDER?.trim() || null;
  const environment = env.TRUST_ENVIRONMENT === 'live' ? 'LIVE' : 'SANDBOX';
  if (!provider) return { configured: false, provider: null, environment, reason: 'PAYMENT_PROVIDER_NOT_CONFIGURED' };
  const prefix = envKey(provider, '');
  const secret = env[`${prefix}SECRET`]?.trim() || env.PAYMENTS_PROVIDER_SECRET?.trim() || '';
  const baseUrl = env[`${prefix}BASE_URL`]?.trim() || env.PAYMENTS_PROVIDER_BASE_URL?.trim() || '';
  if (!secret) return { configured: false, provider, environment, reason: 'PAYMENT_PROVIDER_SECRET_NOT_CONFIGURED' };
  if (!baseUrl) return { configured: false, provider, environment, reason: 'PAYMENT_PROVIDER_BASE_URL_NOT_CONFIGURED' };
  return { configured: true, provider, environment };
}

export function requireConfiguredPaymentProvider(requested: string, env: Record<string, string | undefined> = process.env): string {
  const readiness = getPaymentProviderReadiness(env);
  if (!readiness.configured) throw new Error(readiness.reason);
  if (requested.trim() !== readiness.provider) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
  return readiness.provider!;
}
