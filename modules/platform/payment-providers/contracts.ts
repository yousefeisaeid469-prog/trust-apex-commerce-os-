export type PaymentProviderEnvironment = 'SANDBOX' | 'LIVE';

export type ExternalPaymentStatus = 'pending' | 'requires_action' | 'authorized' | 'captured' | 'failed' | 'cancelled';

export interface PaymentProviderAdapter {
  provider: string;
  environment: PaymentProviderEnvironment;
  createPayment(input: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    customerId: string;
    idempotencyKey: string;
    returnUrl?: string;
  }): Promise<{ providerReference: string; status: ExternalPaymentStatus; clientSecret?: string; raw: unknown }>;
  createPayout(input: {
    payoutId: string;
    amount: number;
    currency: string;
    destinationRef: string;
    idempotencyKey: string;
  }): Promise<{ providerReference: string; status: 'processing' | 'succeeded' | 'failed'; raw: unknown }>;
  refund(input: {
    refundId: string;
    providerReference: string;
    amount: number;
    currency: string;
    reason?: string;
    idempotencyKey: string;
  }): Promise<{ providerReference?: string; status: 'processing' | 'succeeded' | 'failed'; raw: unknown }>;
}
