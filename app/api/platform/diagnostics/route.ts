import { NextResponse } from 'next/server';
import { runtimeVersion } from '../../../../lib/runtime/version';
import { aggregateHealth } from '../../../../modules/platform/observability/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  const checks = [
    { name: 'runtime', state: 'healthy' as const, latencyMs: Date.now() - started, detail: runtimeVersion },
    { name: 'configuration', state: process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET ? 'degraded' as const : 'healthy' as const, latencyMs: 0, detail: 'secret presence only; values are never returned' },
  ];
  const result = aggregateHealth(checks);
  return NextResponse.json({ ok: result.state !== 'unavailable', version: runtimeVersion, ...result, timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
