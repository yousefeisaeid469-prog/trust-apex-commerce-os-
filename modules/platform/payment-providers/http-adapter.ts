import type { ExternalPaymentStatus, PaymentProviderAdapter, PaymentProviderEnvironment } from './contracts';

const statuses: ExternalPaymentStatus[] = ['pending','requires_action','authorized','captured','failed','cancelled'];
const required = (v: string, name: string) => { if (!v.trim()) throw new Error(`${name}_REQUIRED`); return v.trim(); };
const normalizeStatus = (v: unknown): ExternalPaymentStatus => {
  const s = String(v ?? '').toLowerCase();
  if (!statuses.includes(s as ExternalPaymentStatus)) throw new Error('PROVIDER_PAYMENT_STATUS_INVALID');
  return s as ExternalPaymentStatus;
};

export function createHttpPaymentAdapter(provider: string, environment: PaymentProviderEnvironment, input: { baseUrl?: string; secret?: string }): PaymentProviderAdapter {
  const name = required(provider, 'PROVIDER');
  const baseUrl = input.baseUrl?.replace(/\/$/, '');
  const secret = input.secret;
  async function request(path: string, init: RequestInit, capability: string) {
    if (!baseUrl || !secret) throw new Error(`PROVIDER_REQUIRED:${name}:${capability}`);
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
        ...(init.headers ?? {})
      },
      signal: AbortSignal.timeout(Number(process.env.PAYMENT_PROVIDER_TIMEOUT_MS ?? 10000))
    });
    const text = await response.text();
    let body: unknown;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}:${name}`);
    return body as Record<string, unknown>;
  }
  return {
    provider: name,
    environment,
    async createPayment(i) {
      const body = await request('/payments', { method: 'POST', headers: { 'idempotency-key': i.idempotencyKey }, body: JSON.stringify(i) }, 'CREATE_PAYMENT');
      const providerReference = required(String(body.providerReference ?? body.id ?? ''), 'PROVIDER_REFERENCE');
      return { providerReference, status: normalizeStatus(body.status), clientSecret: body.clientSecret ? String(body.clientSecret) : undefined, raw: body };
    },
    async createPayout(i) {
      const body = await request('/payouts', { method: 'POST', headers: { 'idempotency-key': i.idempotencyKey }, body: JSON.stringify(i) }, 'CREATE_PAYOUT');
      const providerReference = required(String(body.providerReference ?? body.id ?? ''), 'PROVIDER_REFERENCE');
      const status = String(body.status ?? '').toLowerCase();
      if (!['processing','succeeded','failed'].includes(status)) throw new Error('PROVIDER_PAYOUT_STATUS_INVALID');
      return { providerReference, status: status as 'processing'|'succeeded'|'failed', raw: body };
    },
    async refund(i) {
      const body = await request('/refunds', { method: 'POST', headers: { 'idempotency-key': i.idempotencyKey }, body: JSON.stringify(i) }, 'REFUND');
      const status = String(body.status ?? '').toLowerCase();
      if (!['processing','succeeded','failed'].includes(status)) throw new Error('PROVIDER_REFUND_STATUS_INVALID');
      return { providerReference: body.providerReference ? String(body.providerReference) : undefined, status: status as 'processing'|'succeeded'|'failed', raw: body };
    }
  };
}
