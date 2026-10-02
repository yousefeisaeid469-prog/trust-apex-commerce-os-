export type FulfillmentStatus = 'unallocated' | 'allocated' | 'packed' | 'shipped' | 'delivered' | 'exception' | 'returned';
export type ShipmentStatus = 'label_pending' | 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'cancelled';
export type CarrierCode = 'TRUST_FLEET' | 'FASTBOX' | 'NILE_EXPRESS';

export type DeliveryAddress = {
  country: string;
  city: string;
  district: string;
  postalCode?: string;
};

export type ShippingQuote = {
  id: string;
  carrier: CarrierCode;
  service: 'standard' | 'express' | 'same_day';
  price: number;
  currency: 'EGP';
  etaMinHours: number;
  etaMaxHours: number;
  carbonGrams: number;
  confidence: number;
};

export type Shipment = {
  id: string;
  orderId: string;
  carrier: CarrierCode;
  service: ShippingQuote['service'];
  status: ShipmentStatus;
  trackingNumber: string;
  warehouseId: string;
  destination: DeliveryAddress;
  eta: string;
  events: Array<{ status: ShipmentStatus; at: string; location?: string }>;
};

export type FulfillmentPlan = {
  orderId: string;
  strategy: 'single_node' | 'split_shipment';
  warehouseIds: string[];
  shipments: Array<{ shipmentId: string; lineCount: number; warehouseId: string }>;
};
