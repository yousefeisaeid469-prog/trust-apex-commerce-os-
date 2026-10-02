import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '../../../../modules/platform/auth/current-user';
import { withPgTransaction, query, databaseConfigured } from '../../../../modules/platform/db/postgres';
import { expireInventoryReservationsTx } from '../../../../modules/commerce/inventory/reservations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!databaseConfigured()) return NextResponse.json({ ok:false, error:'DATABASE_NOT_CONFIGURED' }, { status:503 });
  const user = await getCurrentUser(req);
  if (!user || !hasRole(user, 'admin')) return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });
  const rows = await query(`SELECT status,count(*)::int count,coalesce(sum(quantity),0)::int units FROM trust_inventory_reservations GROUP BY status ORDER BY status`);
  return NextResponse.json({ ok:true, items:rows.rows }, { headers:{'Cache-Control':'no-store'} });
}

export async function POST(req: NextRequest) {
  if (!databaseConfigured()) return NextResponse.json({ ok:false, error:'DATABASE_NOT_CONFIGURED' }, { status:503 });
  const user = await getCurrentUser(req);
  if (!user || !hasRole(user, 'admin')) return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });
  try {
    const body = await req.json().catch(() => ({}));
    const result = await withPgTransaction(client => expireInventoryReservationsTx(client, Number(body?.limit ?? 500)));
    return NextResponse.json({ ok:true, ...result }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error instanceof Error ? error.message : 'INVENTORY_EXPIRY_FAILED' }, { status:400 });
  }
}
