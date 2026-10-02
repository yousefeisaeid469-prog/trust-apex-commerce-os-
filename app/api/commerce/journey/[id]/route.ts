import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getOrderJourney } from '../../../../modules/platform/order-journey-os/core';
import { getCommerceCommandSnapshot } from '../../../../modules/platform/order-journey-os/command-snapshot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const privileged = (role: string) => ['admin', 'support', 'operations'].includes(role);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  try {
    const canSeeFinancials = privileged(user.role);
    const customerId = canSeeFinancials ? undefined : user.id;
    const [journey, snapshot] = await Promise.all([
      getOrderJourney(params.id, customerId),
      getCommerceCommandSnapshot(params.id, customerId),
    ]);
    if (!journey || !snapshot) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });

    const safeJourney = canSeeFinancials ? journey : {
      ...journey,
      payouts: [],
      balanceReleases: [],
      revenue: [],
    };
    return NextResponse.json({
      ok: true,
      version: 'V397.0.0',
      surface: 'UNIFIED_COMMERCE_JOURNEY',
      permissions: { financials: canSeeFinancials, operations: canSeeFinancials },
      snapshot,
      journey: safeJourney,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'COMMERCE_JOURNEY_FAILED';
    return NextResponse.json({ ok: false, error: message }, { status: message === 'DATABASE_NOT_CONFIGURED' ? 503 : 400 });
  }
}
