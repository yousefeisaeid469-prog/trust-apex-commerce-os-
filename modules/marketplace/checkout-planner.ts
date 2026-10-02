import { query } from '../platform/db/postgres';
import { resolveBuyBox, type Offer } from './offers';
import { getFulfillmentOptions, type FulfillmentOption } from './fulfillment';

import { allocateShipments, type CheckoutPlanItem, type MarketplaceCheckoutPlan } from './checkout-plan';

const num = (v: unknown, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const clean = (v: unknown, max = 80) => String(v ?? '').trim().slice(0, max);

async function findOffer(productId: string, requestedOfferId?: string): Promise<Offer> {
  if (requestedOfferId) {
    const r = await query(`select o.*,m.store_name from trust_marketplace_offers o join trust_merchant_profiles m on m.id=o.merchant_id where o.id=$1 and o.product_id=$2 and o.status='ACTIVE' limit 1`, [requestedOfferId, productId]);
    if (r.rows[0]) return {
      id: String(r.rows[0].id), catalogItemId: String(r.rows[0].catalog_item_id), productId: String(r.rows[0].product_id), merchantId: String(r.rows[0].merchant_id),
      storeName: String(r.rows[0].store_name ?? ''), price: num(r.rows[0].price), shippingFee: num(r.rows[0].shipping_fee), stock: num(r.rows[0].stock), handlingDays: num(r.rows[0].handling_days),
      deliveryMinDays: num(r.rows[0].delivery_min_days), deliveryMaxDays: num(r.rows[0].delivery_max_days), fulfillmentMode: r.rows[0].fulfillment_mode,
      sellerRating: num(r.rows[0].seller_rating), sellerOrders: num(r.rows[0].seller_orders), returnRateBps: num(r.rows[0].return_rate_bps), status: String(r.rows[0].status),
    };
    throw new Error('OFFER_NOT_AVAILABLE');
  }
  const selected = await resolveBuyBoxForProduct(productId);
  if (!selected) throw new Error('NO_MARKETPLACE_OFFER');
  return selected;
}

async function resolveBuyBoxForProduct(productId: string): Promise<Offer | undefined> {
  const r = await query(`select catalog_item_id from trust_marketplace_offers where product_id=$1 and status='ACTIVE' order by stock desc limit 1`, [productId]);
  if (!r.rows[0]) return undefined;
  const box = await resolveBuyBox(String(r.rows[0].catalog_item_id));
  return box.offer;
}

export async function planMarketplaceCheckout(lines: Array<{ productId: string; qty: number; offerId?: string }>, destinationRegion: string): Promise<MarketplaceCheckoutPlan> {
  const region = clean(destinationRegion);
  if (!region) throw new Error('DESTINATION_REGION_REQUIRED');
  if (!Array.isArray(lines) || !lines.length) throw new Error('INVALID_CHECKOUT');

  const items: CheckoutPlanItem[] = [];
  for (const line of lines) {
    if (!line?.productId || !Number.isInteger(line.qty) || line.qty < 1) throw new Error('INVALID_QUANTITY');
    const offer = await findOffer(String(line.productId), line.offerId);
    if (offer.stock < line.qty) throw new Error('INSUFFICIENT_OFFER_STOCK');

    const network: FulfillmentOption[] = await getFulfillmentOptions(offer.id, region, line.qty);
    const best = network[0];
    if (best) {
      items.push({ productId: String(line.productId), qty: line.qty, offerId: offer.id, unitPrice: offer.price, sellerId: offer.merchantId, locationId: best.locationId,
        destinationRegion: region, minDays: best.minDays, maxDays: best.maxDays, shippingCost: best.shippingCost, fulfillmentCost: best.fulfillmentCost, source: 'NETWORK' });
    } else {
      // Safe compatibility path for offers created before a merchant has configured a network route.
      // It never invents a location; checkout remains bound to the exact offer's own delivery promise.
      items.push({ productId: String(line.productId), qty: line.qty, offerId: offer.id, unitPrice: offer.price, sellerId: offer.merchantId,
        destinationRegion: region, minDays: offer.deliveryMinDays + offer.handlingDays, maxDays: offer.deliveryMaxDays + offer.handlingDays,
        shippingCost: offer.shippingFee, fulfillmentCost: 0, source: 'OFFER_FALLBACK' });
    }
  }
  const shipments = allocateShipments(items);
  const shipping = Math.round(shipments.reduce((sum, s) => sum + s.totalCost, 0) * 100) / 100;
  return {
    destinationRegion: region,
    items,
    shipments,
    shipping,
    minDeliveryDays: shipments.length ? Math.min(...shipments.map(s => s.minDays)) : 0,
    maxDeliveryDays: shipments.length ? Math.max(...shipments.map(s => s.maxDays)) : 0,
    splitShipment: shipments.length > 1,
  };
}
