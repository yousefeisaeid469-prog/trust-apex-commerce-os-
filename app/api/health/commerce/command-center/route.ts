import { NextResponse } from 'next/server';
import { databaseConfigured } from '../../../../../modules/platform/db/postgres';
import { captureCommerceCommandCenterSnapshot } from '../../../../../modules/platform/durable-events/command-center';
import { TRUST_VERSION_NUMBER } from '../../../../../lib/runtime/version';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!databaseConfigured()) {
    return NextResponse.json({ ok: false, status: 'not_ready', version: TRUST_VERSION_NUMBER, error: 'DATABASE_NOT_CONFIGURED' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
  try {
    const center = await captureCommerceCommandCenterSnapshot();
    return NextResponse.json({ ok: center.state === 'HEALTHY', status: center.state.toLowerCase(), version: TRUST_VERSION_NUMBER, ...center }, { status: center.state === 'HEALTHY' ? 200 : 503, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ ok: false, status: 'unknown', version: TRUST_VERSION_NUMBER, error: error instanceof Error ? error.message : 'COMMERCE_COMMAND_CENTER_FAILED' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
