import { NextResponse } from 'next/server';
import { quoteDelivery } from '../../../../modules/commerce/logistics/engine';
import type { DeliveryAddress } from '../../../../modules/commerce/logistics/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { destination?: DeliveryAddress; weightKg?: number };
    if (!body.destination?.city || !body.destination?.district) return NextResponse.json({ error: 'DESTINATION_REQUIRED' }, { status: 400 });
    return NextResponse.json({ quotes: quoteDelivery(body.destination, body.weightKg) });
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
}
