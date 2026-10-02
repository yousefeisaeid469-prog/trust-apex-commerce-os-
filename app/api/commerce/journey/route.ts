import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getCommercialJourney } from '../../../../modules/commerce/journey/commercial-journey';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401 });
  try {
    return NextResponse.json({ ok:true, journey:await getCommercialJourney(user.id) }, { headers:{ 'Cache-Control':'no-store' } });
  } catch (e) {
    return NextResponse.json({ ok:false, error:e instanceof Error ? e.message : 'JOURNEY_FAILED' }, { status:400 });
  }
}
