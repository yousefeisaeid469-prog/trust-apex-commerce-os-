import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, AuthRequiredError } from '../../../../../modules/platform/auth/current-user';
import { getOrderJourney } from '../../../../../modules/platform/order-journey-os/core';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw new AuthRequiredError();
    const privileged = ['admin','support','operations'].includes(user.role);
    const journey = await getOrderJourney(params.id, privileged ? undefined : user.id);
    if (!journey) return NextResponse.json({ok:false,error:'ORDER_NOT_FOUND'},{status:404});
    return NextResponse.json({ok:true,version:'V388.0.0',journey},{headers:{'Cache-Control':'no-store'}});
  } catch (e) {
    const status = e instanceof AuthRequiredError ? 401 : e instanceof Error && e.message==='DATABASE_NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ok:false,error:e instanceof Error ? e.message : 'ORDER_JOURNEY_ERROR'},{status});
  }
}
