export interface PaymentProviderAdapter { readonly name: string; authorize(input: { tenantId: string; amountMinor: number; currency: string; idempotencyKey: string }): Promise<{ providerReference: string; status: 'authorized' | 'declined' }>; capture(input: { providerReference: string; amountMinor: number }): Promise<{ status: 'captured' | 'failed' }>; refund(input: { providerReference: string; amountMinor: number; idempotencyKey: string }): Promise<{ status: 'refunded' | 'failed' }>; }
export interface LogisticsProviderAdapter { readonly name: string; createShipment(input: { tenantId: string; orderId: string }): Promise<{ providerReference: string; status: 'created' | 'failed' }>; }
export interface NotificationProviderAdapter { readonly name: string; send(input: { tenantId: string; destination: string; body: string; idempotencyKey: string }): Promise<{ providerReference: string; status: 'sent' | 'failed' }>; }

export class AdapterRegistry<T extends { name: string }> {
  private readonly adapters = new Map<string, T>();
  register(adapter: T) { if (this.adapters.has(adapter.name)) throw new Error(`ADAPTER_ALREADY_REGISTERED:${adapter.name}`); this.adapters.set(adapter.name, adapter); }
  get(name: string) { const adapter = this.adapters.get(name); if (!adapter) throw new Error(`ADAPTER_NOT_FOUND:${name}`); return adapter; }
  names() { return [...this.adapters.keys()].sort(); }
}
