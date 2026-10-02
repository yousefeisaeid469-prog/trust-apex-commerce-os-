import type { DeliveryAddress, FulfillmentPlan, Shipment, ShippingQuote, CarrierCode } from './types';

const carriers: Array<{ carrier: CarrierCode; service: ShippingQuote['service']; base: number; min: number; max: number; carbon: number }> = [
  { carrier: 'TRUST_FLEET', service: 'same_day', base: 95, min: 3, max: 8, carbon: 420 },
  { carrier: 'FASTBOX', service: 'express', base: 65, min: 8, max: 18, carbon: 560 },
  { carrier: 'NILE_EXPRESS', service: 'standard', base: 42, min: 24, max: 48, carbon: 690 },
];

export function quoteDelivery(destination: DeliveryAddress, weightKg = 1): ShippingQuote[] {
  const distanceFactor = destination.city.trim().toLowerCase() === 'cairo' ? 1 : 1.18;
  return carriers.map((c, index) => ({
    id: `quote_${crypto.randomUUID()}`,
    carrier: c.carrier,
    service: c.service,
    price: Math.round((c.base + Math.max(0, weightKg - 1) * 8) * distanceFactor),
    currency: 'EGP',
    etaMinHours: c.min,
    etaMaxHours: c.max,
    carbonGrams: Math.round(c.carbon * distanceFactor),
    confidence: Math.max(0.86, 0.97 - index * 0.03),
  }));
}

export function createDemoShipment(orderId: string, quote: ShippingQuote, destination: DeliveryAddress, warehouseId = 'WH-CAI-01'): Shipment {
  const now = Date.now();
  const eta = new Date(now + quote.etaMaxHours * 3600_000).toISOString();
  return {
    id: `shp_${crypto.randomUUID()}`,
    orderId,
    carrier: quote.carrier,
    service: quote.service,
    status: 'in_transit',
    trackingNumber: `TR${Math.floor(100000000 + Math.random() * 900000000)}`,
    warehouseId,
    destination,
    eta,
    events: [
      { status: 'label_created', at: new Date(now - 5 * 3600_000).toISOString(), location: warehouseId },
      { status: 'picked_up', at: new Date(now - 3 * 3600_000).toISOString(), location: destination.city },
      { status: 'in_transit', at: new Date(now - 1 * 3600_000).toISOString(), location: destination.district },
    ],
  };
}

export function buildFulfillmentPlan(orderId: string, itemCount: number, stockNodes = 2): FulfillmentPlan {
  const split = itemCount > 3 && stockNodes > 1;
  const warehouses = split ? ['WH-CAI-01', 'WH-GIZ-02'] : ['WH-CAI-01'];
  const shipments = split
    ? [{ shipmentId: `shp_${crypto.randomUUID()}`, lineCount: Math.ceil(itemCount / 2), warehouseId: warehouses[0] }, { shipmentId: `shp_${crypto.randomUUID()}`, lineCount: Math.floor(itemCount / 2), warehouseId: warehouses[1] }]
    : [{ shipmentId: `shp_${crypto.randomUUID()}`, lineCount: itemCount, warehouseId: warehouses[0] }];
  return { orderId, strategy: split ? 'split_shipment' : 'single_node', warehouseIds: warehouses, shipments };
}
