export type ShippingAddress = {
  fullName: string; phone: string; governorate: string; city: string; street: string; building?: string; apartment?: string;
};

export function validateShippingAddress(input: Partial<ShippingAddress>): ShippingAddress {
  const required = ['fullName','phone','governorate','city','street'] as const;
  for (const key of required) if (typeof input[key] !== 'string' || !input[key]!.trim()) throw new Error(`ADDRESS_${key.toUpperCase()}_REQUIRED`);
  if (!/^01\d{9}$/.test(input.phone!.replace(/\s+/g, ''))) throw new Error('INVALID_EGYPT_PHONE');
  return {
    fullName: input.fullName!.trim(), phone: input.phone!.replace(/\s+/g,''), governorate: input.governorate!.trim(),
    city: input.city!.trim(), street: input.street!.trim(), building: input.building?.trim(), apartment: input.apartment?.trim(),
  };
}
