import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getBuyerOperatingSurface } from '../../../../modules/customer-experience/buyer-operating-system';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401, headers:{'Cache-Control':'no-store'} });
  try {
    const surface = await getBuyerOperatingSurface(user.id);
    return NextResponse.json({ ok:true, version:'V399.0.0', ...surface }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'BUYER_OPERATING_SURFACE_ERROR';
    const status = message === 'DATABASE_NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ ok:false, error:message, surfaceStatus:'ERROR' }, { status, headers:{'Cache-Control':'no-store'} });
  }
}
