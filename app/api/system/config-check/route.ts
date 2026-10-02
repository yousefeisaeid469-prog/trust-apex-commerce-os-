import { NextResponse } from 'next/server';
import { productionConfigCheck } from '@/modules/platform/config/env';

export const dynamic = 'force-dynamic';
export function GET() {
  const result = productionConfigCheck();
  return NextResponse.json({ ...result, missing: result.missing });
}
