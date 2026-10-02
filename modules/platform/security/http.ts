import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 120;
const SENSITIVE_LIMIT = 30;

function clientKey(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

export function rateLimit(req: NextRequest, sensitive = false) {
  const key = `${sensitive ? 'sensitive' : 'api'}:${clientKey(req)}`;
  const now = Date.now();
  const current = buckets.get(key);
  const limit = sensitive ? SENSITIVE_LIMIT : DEFAULT_LIMIT;
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, limit, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }
  current.count += 1;
  return { allowed: current.count <= limit, limit, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function applyRateHeaders(response: NextResponse, result: ReturnType<typeof rateLimit>) {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return response;
}

export function allowedCorsOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  const configured = (process.env.TRUST_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  if (configured.length === 0) return process.env.NODE_ENV === 'development' ? origin : null;
  return configured.includes(origin) ? origin : null;
}

export function assertWebhookSignature(raw: string, provided: string, secret: string) {
  if (!secret || !provided) return false;
  const expected = createHash('sha256').update(`${secret}:${raw}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided.replace(/^sha256=/, ''), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function securityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cache-Control', response.headers.get('Cache-Control') || 'no-store');
  return response;
}
