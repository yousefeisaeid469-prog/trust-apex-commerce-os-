import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../../modules/platform/auth/current-user';
import { getBuyerOrderJourney } from '../../../../../../modules/customer-experience/buyer-operating-system';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401, headers:{'Cache-Control':'no-store'} });
  try {
    const journey = await getBuyerOrderJourney(params.id, user.id);
    if (!journey) return NextResponse.json({ ok:false, error:'ORDER_NOT_FOUND' }, { status:404, headers:{'Cache-Control':'no-store'} });
    return NextResponse.json({ ok:true, version:'V399.0.0', journey, source:'LIVE_POSTGRES_COMMERCE_AUTHORITIES' }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'BUYER_ORDER_JOURNEY_ERROR';
    const status = message === 'DATABASE_NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ ok:false, error:message }, { status, headers:{'Cache-Control':'no-store'} });
  }
}
