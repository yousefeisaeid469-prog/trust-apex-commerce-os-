import { NextResponse } from 'next/server';
import { buildFulfillmentPlan } from '../../../../modules/commerce/logistics/engine';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string; itemCount?: number; stockNodes?: number };
    const itemCount = Number(body.itemCount);
    if (!body.orderId || !Number.isInteger(itemCount) || itemCount < 1) return NextResponse.json({ error: 'ORDER_AND_ITEM_COUNT_REQUIRED' }, { status: 400 });
    return NextResponse.json({ plan: buildFulfillmentPlan(body.orderId, itemCount, body.stockNodes ?? 2) });
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
}
