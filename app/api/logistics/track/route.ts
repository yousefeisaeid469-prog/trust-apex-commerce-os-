import { NextResponse } from 'next/server';
import { createDemoShipment, quoteDelivery } from '../../../../modules/commerce/logistics/engine';
import type { DeliveryAddress } from '../../../../modules/commerce/logistics/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string; destination?: DeliveryAddress };
    if (!body.orderId || !body.destination?.city || !body.destination?.district) return NextResponse.json({ error: 'ORDER_AND_DESTINATION_REQUIRED' }, { status: 400 });
    const quote = quoteDelivery(body.destination)[0];
    return NextResponse.json({ shipment: createDemoShipment(body.orderId, quote, body.destination) });
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
}
