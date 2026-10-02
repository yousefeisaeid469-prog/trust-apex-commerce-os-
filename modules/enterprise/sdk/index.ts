export type TrustSdkOptions = { baseUrl: string; apiKey: string; apiVersion?: 'v1' };
export type TrustRequest = { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body?: unknown; idempotencyKey?: string };
export function createTrustRequest(options: TrustSdkOptions, request: TrustRequest) {
  if (!options.baseUrl || !options.apiKey) throw new Error('SDK_CONFIGURATION_REQUIRED');
  const version = options.apiVersion ?? 'v1';
  const path = request.path.startsWith('/') ? request.path : `/${request.path}`;
  return { url: `${options.baseUrl.replace(/\/$/, '')}/api/${version}${path}`, headers: { Authorization: `Bearer ${options.apiKey}`, 'X-Trust-API-Version': version, ...(request.idempotencyKey ? { 'Idempotency-Key': request.idempotencyKey } : {}) }, method: request.method, body: request.body };
}
