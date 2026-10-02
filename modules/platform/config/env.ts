/** Server-only environment contract. Never import this module from client components. */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.TRUST_SESSION_SECRET,
  webhookSecret: process.env.TRUST_WEBHOOK_SECRET ?? process.env.TRUST_PAYMENT_WEBHOOK_SECRET,
  databaseTls: process.env.DATABASE_TLS,
  paymentProvider: process.env.PAYMENTS_PROVIDER,
  paymentProviderSecret: process.env.PAYMENTS_PROVIDER_SECRET,
  fulfillmentEnvironment: process.env.TRUST_ENVIRONMENT,

} as const;

export function productionConfigCheck() {
  const required = ['DATABASE_URL', 'TRUST_SESSION_SECRET', 'TRUST_WEBHOOK_SECRET'] as const;
  const missing: string[] = required.filter((key) => !process.env[key]);
  const invalid: string[] = [];
  if (env.nodeEnv === 'production') {
    if ((process.env.TRUST_SESSION_SECRET ?? '').length < 32) invalid.push('TRUST_SESSION_SECRET_MIN_32');
    if ((process.env.TRUST_WEBHOOK_SECRET ?? '').length < 32) invalid.push('TRUST_WEBHOOK_SECRET_MIN_32');
    if (process.env.TRUST_ENVIRONMENT === 'live' && (!env.paymentProvider || !env.paymentProviderSecret)) invalid.push('LIVE_PAYMENT_PROVIDER_REQUIRED');
  }
  const productionTransportMissing = env.nodeEnv === 'production' && !(process.env.TRUST_DB_SSL === 'true' || /[?&]sslmode=(?:require|verify-full)(?:&|$)/i.test(env.databaseUrl ?? ''));
  if (productionTransportMissing) missing.push('DATABASE_TLS');
  return { ok: missing.length === 0 && invalid.length === 0, missing, invalid, environment: env.nodeEnv };
}


export function assertProductionConfig() {
  const check = productionConfigCheck();
  if (env.nodeEnv === 'production' && !check.ok) {
    throw new Error(`PRODUCTION_CONFIGURATION_INVALID: missing=${check.missing.join(',')} invalid=${check.invalid.join(',')}`);
  }
}
