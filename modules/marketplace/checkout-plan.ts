export type CheckoutPlanItem = {
  productId: string;
  qty: number;
  offerId: string;
  unitPrice: number;
  sellerId: string;
  locationId?: string;
  destinationRegion: string;
  minDays: number;
  maxDays: number;
  shippingCost: number;
  fulfillmentCost: number;
  source: 'NETWORK' | 'OFFER_FALLBACK';
};

export type CheckoutShipment = {
  key: string;
  merchantId: string;
  offerIds: string[];
  locationId?: string;
  destinationRegion: string;
  itemCount: number;
  minDays: number;
  maxDays: number;
  shippingCost: number;
  fulfillmentCost: number;
  totalCost: number;
  source: 'NETWORK' | 'OFFER_FALLBACK';
};

export type MarketplaceCheckoutPlan = {
  destinationRegion: string;
  items: CheckoutPlanItem[];
  shipments: CheckoutShipment[];
  shipping: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  splitShipment: boolean;
};

const num = (v: unknown, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const clean = (v: unknown, max = 80) => String(v ?? '').trim().slice(0, max);

export function allocateShipments(items: CheckoutPlanItem[]): CheckoutShipment[] {
  const groups = new Map<string, CheckoutPlanItem[]>();
  for (const item of items) {
    const key = `${item.source}:${item.locationId ?? item.offerId}:${item.sellerId}:${item.destinationRegion}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }
  return [...groups.entries()].map(([key, group]) => {
    const first = group[0];
    const shippingCost = Math.max(...group.map(x => x.shippingCost), 0);
    const fulfillmentCost = group.reduce((sum, x) => sum + x.fulfillmentCost * x.qty, 0);
    return {
      key,
      merchantId: first.sellerId,
      offerIds: [...new Set(group.map(x => x.offerId))],
      locationId: first.locationId,
      destinationRegion: first.destinationRegion,
      itemCount: group.reduce((sum, x) => sum + x.qty, 0),
      minDays: Math.max(...group.map(x => x.minDays), 0),
      maxDays: Math.max(...group.map(x => x.maxDays), 0),
      shippingCost,
      fulfillmentCost,
      totalCost: shippingCost + fulfillmentCost,
      source: first.source,
    };
  }).sort((a, b) => a.maxDays - b.maxDays || a.totalCost - b.totalCost || a.key.localeCompare(b.key));
}

