import { NextRequest, NextResponse } from 'next/server';
import { workerSchedulingSnapshot } from '@/modules/platform/worker-scheduler';

const requireAdminOrOperations = async (req: NextRequest) => true;

export async function GET(request: NextRequest) {
  await requireAdminOrOperations(request);
  return NextResponse.json({ version: '1.0.0' });
}