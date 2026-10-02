import { NextResponse } from 'next/server';
import { getDataCoreSnapshot } from '../../../lib/data-core/snapshot';

export async function GET() {
  const snapshot = await getDataCoreSnapshot();
  return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
}
