import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { productionConfigCheck } from './modules/platform/config/env';

function nonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const check = productionConfigCheck();
    if (!check.ok) {
      throw new Error(`PRODUCTION_CONFIGURATION_INVALID: missing ${check.missing.join(', ')}`);
    }
  }

  const requestNonce = nonce();
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${requestNonce}'`,
    `style-src 'self' 'nonce-${requestNonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  const requestId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-nonce', requestNonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
