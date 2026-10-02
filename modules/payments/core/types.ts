export type PaymentStatus = 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type PaymentIntent = {
  id: string; orderId: string; customerId: string; amount: number; currency: 'EGP'; status: PaymentStatus;
  provider: 'adapter'; providerReference?: string; createdAt: string; updatedAt: string;
};
