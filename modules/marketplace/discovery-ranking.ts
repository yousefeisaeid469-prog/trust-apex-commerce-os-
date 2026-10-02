export function normalizeSearch(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
export function rankSearchScore(input: { textRank: number; rating: number; stock: number; price: number; oldPrice?: number | null; }) {
  const text = Math.max(0, Math.min(1, input.textRank));
  const trust = Math.max(0, Math.min(1, input.rating / 5));
  const availability = input.stock > 0 ? 1 : 0;
  const discount = input.oldPrice && input.oldPrice > input.price ? Math.min(1, (input.oldPrice - input.price) / input.oldPrice) : 0;
  return text * 0.58 + trust * 0.18 + availability * 0.16 + discount * 0.08;
}
