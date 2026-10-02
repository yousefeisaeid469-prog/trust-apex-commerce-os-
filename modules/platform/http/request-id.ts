import { randomUUID } from 'crypto';

export function getRequestId(request: Request): string {
  const supplied = request.headers.get('x-request-id')?.trim();
  return supplied && supplied.length <= 128 ? supplied : randomUUID();
}

export function withRequestId(headers: HeadersInit | undefined, requestId: string): Headers {
  const result = new Headers(headers);
  result.set('x-request-id', requestId);
  return result;
}
