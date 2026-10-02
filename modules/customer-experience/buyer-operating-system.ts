import { query } from '../platform/db/postgres';
import { getCommerceCommandSnapshot, listCommerceCommandSnapshots } from '../platform/order-journey-os/command-snapshot';

export type BuyerOperatingSnapshot = Record<string, unknown>;

export async function getBuyerOperatingSnapshot(customerId: string): Promise<BuyerOperatingSnapshot | null> {
  const result = await query<BuyerOperatingSnapshot>(
    `select * from trust_buyer_operating_snapshot where customer_id=$1`,
    [customerId],
  );
  return result.rows[0] ?? null;
}

export async function getBuyerOperatingSurface(customerId: string) {
  const [snapshot, journeys] = await Promise.all([
    getBuyerOperatingSnapshot(customerId),
    listCommerceCommandSnapshots({ customerId, limit: 25 }),
  ]);
  return {
    surfaceStatus: 'LIVE',
    source: 'LIVE_POSTGRES_BUYER_AUTHORITIES',
    snapshot,
    orders: journeys,
  };
}

export async function getBuyerOrderJourney(orderId: string, customerId: string) {
  return getCommerceCommandSnapshot(orderId, customerId);
}
