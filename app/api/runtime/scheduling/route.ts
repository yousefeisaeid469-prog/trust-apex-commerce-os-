import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrOperations } from '../../../../modules/platform/auth/operations-access';
import { workerSchedulingSnapshot } from '@/modules/platform/worker-scheduler';

export async function GET(request: NextRequest) {
  await requireAdminOrOperations(request);
  return NextResponse.json({ version: '1.0.0' });
}