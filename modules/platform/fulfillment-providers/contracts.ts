import type { DeliveryExceptionCode, ShipmentStatus } from '../fulfillment-tracking-3/contracts';

export type FulfillmentProviderCapability = 'CREATE_LABEL' | 'TRACK' | 'CANCEL_LABEL';
export type ProviderEnvironment = 'SANDBOX' | 'LIVE';

export interface NormalizedTrackingUpdate {
  provider: string;
  eventId: string;
  shipmentId?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  occurredAt: string;
  location?: string;
  description?: string;
  exceptionCode?: DeliveryExceptionCode;
  etaAt?: string;
  raw: unknown;
}

export interface FulfillmentProviderAdapter {
  provider: string;
  environment: ProviderEnvironment;
  capabilities: FulfillmentProviderCapability[];
  createLabel(input: { shipmentId: string; orderId: string; service: string; destination: unknown }): Promise<{ trackingNumber: string; providerReference?: string }>;
  cancelLabel(input: { trackingNumber: string; providerReference?: string }): Promise<void>;
  getTracking(input: { trackingNumber: string }): Promise<Omit<NormalizedTrackingUpdate, 'provider' | 'eventId' | 'raw'>>;
  parseWebhook(input: { eventId: string; payload: unknown }): NormalizedTrackingUpdate;
}
