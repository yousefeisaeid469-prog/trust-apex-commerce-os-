export type GuestInfo = { name: string; phone: string; address: string };

const PHONE_RE = /^01[0125]\d{8}$/;

export function validateGuest(guest?: GuestInfo) {
  if (!guest) throw new Error('BUYER_IDENTITY_REQUIRED');
  const name = guest.name?.trim();
  const phone = guest.phone?.trim();
  const address = guest.address?.trim();
  if (!name || name.length < 2 || name.length > 120) throw new Error('INVALID_GUEST_NAME');
  if (!phone || !PHONE_RE.test(phone)) throw new Error('INVALID_GUEST_PHONE');
  if (!address || address.length < 10 || address.length > 500) throw new Error('INVALID_GUEST_ADDRESS');
  return { name, phone, address };
}
