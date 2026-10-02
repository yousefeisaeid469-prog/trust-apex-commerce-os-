import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { listForCustomer, setPreference } from '../../../modules/platform/notifications-3/core';
import type { NotificationChannel, NotificationTopic } from '../../../modules/platform/notifications-3/contracts';

export const dynamic = 'force-dynamic';

const channels = new Set<NotificationChannel>(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']);
const topics = new Set<NotificationTopic>([
  'ORDER_CONFIRMED', 'ORDER_PROCESSING', 'ORDER_SHIPPED', 'ORDER_DELIVERED',
  'ORDER_CANCELLED', 'ORDER_REFUNDED', 'DELIVERY_ATTENTION',
]);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return json({ ok: false, error: 'AUTH_REQUIRED', surfaceStatus: 'ERROR' }, 401);
  const raw = Number(request.nextUrl.searchParams.get('limit') ?? '50');
  const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.floor(raw), 1), 100) : 50;
  const notifications = await listForCustomer(user.id, limit);
  const unread = notifications.filter((item: any) => !item.read_at).length;
  return json({ ok: true, surfaceStatus: 'LIVE', notifications, unreadCount: unread });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return json({ ok: false, error: 'AUTH_REQUIRED', surfaceStatus: 'ERROR' }, 401);
  try {
    const body = await request.json();
    const action = String(body?.action ?? '');
    if (action === 'mark_read') {
      const id = String(body?.id ?? '');
      if (!id) return json({ ok: false, error: 'NOTIFICATION_ID_REQUIRED', surfaceStatus: 'ERROR' }, 400);
      const { query } = await import('../../../modules/platform/db/postgres');
      const result = await query(
        `update platform_notifications set read_at=coalesce(read_at,now()), updated_at=now()
         where id=$1 and recipient_id=$2 returning id,read_at`,
        [id, user.id],
      );
      if (!result.rows[0]) return json({ ok: false, error: 'NOTIFICATION_NOT_FOUND', surfaceStatus: 'ERROR' }, 404);
      return json({ ok: true, surfaceStatus: 'LIVE', notification: result.rows[0] });
    }
    if (action === 'mark_all_read') {
      const { query } = await import('../../../modules/platform/db/postgres');
      const result = await query(
        `update platform_notifications set read_at=now(), updated_at=now()
         where recipient_id=$1 and read_at is null returning id`,
        [user.id],
      );
      return json({ ok: true, surfaceStatus: 'LIVE', markedRead: result.rowCount ?? 0 });
    }
    if (action === 'set_preference') {
      const channel = String(body?.channel) as NotificationChannel;
      const topic = String(body?.topic) as NotificationTopic;
      if (!channels.has(channel) || !topics.has(topic) || typeof body?.enabled !== 'boolean') {
        return json({ ok: false, error: 'INVALID_NOTIFICATION_PREFERENCE', surfaceStatus: 'ERROR' }, 400);
      }
      const preference = await setPreference({ customerId: user.id, channel, topic, enabled: body.enabled });
      return json({ ok: true, surfaceStatus: 'LIVE', preference });
    }
    return json({ ok: false, error: 'UNSUPPORTED_NOTIFICATION_ACTION', surfaceStatus: 'ERROR' }, 400);
  } catch {
    return json({ ok: false, error: 'INVALID_REQUEST', surfaceStatus: 'ERROR' }, 400);
  }
}
