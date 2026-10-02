export type CartInputLine = { productId: string; qty: number };
export type CartProductSnapshot = { productId: string; name: string; unitPrice: number; stock: number; image?: string };
export type CartStateCode = 'READY' | 'CART_EMPTY' | 'INVALID_QUANTITY' | 'PRODUCT_UNAVAILABLE' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';

export const CART_CHECKOUT_POLICY = Object.freeze({
  currency: 'EGP',
  freeShippingThreshold: 1500,
  standardShipping: 60,
  maxQuantityPerLine: 999,
} as const);

export function normalizeCartLines(lines: CartInputLine[]): CartInputLine[] {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const merged = new Map<string, number>();
  for (const line of lines) {
    const productId = typeof line?.productId === 'string' ? line.productId.trim() : '';
    const qty = Number(line?.qty);
    if (!productId || !Number.isInteger(qty) || qty < 1 || qty > CART_CHECKOUT_POLICY.maxQuantityPerLine) {
      throw new Error('INVALID_QUANTITY');
    }
    merged.set(productId, (merged.get(productId) ?? 0) + qty);
  }
  return [...merged].map(([productId, qty]) => ({ productId, qty }));
}

export function calculateCartTotals(items: Array<{ qty: number; unitPrice: number }>) {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= CART_CHECKOUT_POLICY.freeShippingThreshold ? 0 : CART_CHECKOUT_POLICY.standardShipping;
  return { subtotal, shipping, total: subtotal + shipping, currency: CART_CHECKOUT_POLICY.currency as 'EGP' };
}

export function reconcileCart(lines: CartInputLine[], products: CartProductSnapshot[]) {
  const normalized = normalizeCartLines(lines);
  if (normalized.length === 0) return { code: 'CART_EMPTY' as const, lines: [], items: [], ...calculateCartTotals([]), warnings: [] as string[] };
  const byId = new Map(products.map((product) => [product.productId, product]));
  const warnings: string[] = [];
  const items = normalized.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new Error('PRODUCT_UNAVAILABLE');
    const availableQty = Math.min(line.qty, Math.max(0, product.stock));
    if (availableQty < line.qty) warnings.push(`INSUFFICIENT_STOCK:${line.productId}`);
    return { ...line, name: product.name, unitPrice: product.unitPrice, stock: product.stock, image: product.image, lineTotal: availableQty * product.unitPrice };
  });
  const totals = calculateCartTotals(items.map((item) => ({ qty: Math.min(item.qty, Math.max(0, item.stock)), unitPrice: item.unitPrice })));
  return { code: warnings.length ? 'INSUFFICIENT_STOCK' as const : 'READY' as const, lines: normalized, items, ...totals, warnings };
}

export function checkoutErrorMessage(code: string) {
  const messages: Record<string, string> = {
    CART_EMPTY: 'السلة فاضية حاليًا.',
    INVALID_QUANTITY: 'الكمية غير صالحة.',
    PRODUCT_UNAVAILABLE: 'في منتج لم يعد متاحًا.',
    INSUFFICIENT_STOCK: 'الكمية المطلوبة أكبر من المخزون المتاح.',
    PRICE_CHANGED: 'سعر منتج اتغير — راجع الإجمالي قبل التأكيد.',
    IDEMPOTENCY_KEY_REUSED: 'طلب مكرر بمفتاح مختلف البيانات.',
  };
  return messages[code] ?? 'حصل خطأ أثناء تجهيز الطلب.';
}
