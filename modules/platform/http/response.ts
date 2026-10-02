import { NextResponse } from 'next/server';
import type { RequestContext } from '../runtime/request-context';

export type ApiMeta = { requestId: string; traceId: string; durationMs: number; surfaceStatus?: string };
export function apiResponse<T>(data: T, ctx: RequestContext, init: ResponseInit = {}, surfaceStatus?: string) {
  const meta: ApiMeta = { requestId: ctx.requestId, traceId: ctx.traceId, durationMs: Date.now() - ctx.startedAt, ...(surfaceStatus ? { surfaceStatus } : {}) };
  return NextResponse.json({ ...((data && typeof data === 'object' && !Array.isArray(data)) ? data : { data }), meta }, { ...init, headers: { 'cache-control': 'no-store', 'x-request-id': ctx.requestId, 'x-trace-id': ctx.traceId, ...(init.headers ?? {}) } });
}
export function apiError(error: unknown, ctx: RequestContext, status = 500) {
  const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
  return apiResponse({ error: code }, ctx, { status }, 'ERROR');
}
