'use client';

import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  pending: 'بانتظار تأكيد الدفع',
  confirmed: 'تم تأكيد الطلب',
  processing: 'جاري التجهيز',
  shipped: 'خرج للتوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مسترجع',
};
const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

type OrderItem = { productId: string; name: string; image: string; quantity: number; unitPrice: number };
type OrderResult = { id: string; status: string; paymentMethod: string; subtotal: number; shipping: number; total: number; currency: string; createdAt: string };

const money = (n: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);

export default function OrderTracker() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function lookup() {
    setError('');
    setOrder(null);
    if (!orderId.trim()) { setError('اكتب رقم الطلب'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ orderId: orderId.trim() });
      if (phone.trim()) params.set('phone', phone.trim());
      const res = await fetch(`/api/orders/lookup?${params}`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) {
        setError(
          data.error === 'ORDER_ACCESS_DENIED' ? 'اكتب رقم التليفون اللي استخدمته وقت الطلب'
          : data.error === 'ORDER_NOT_FOUND' ? 'مفيش طلب بالرقم ده'
          : 'رقم الطلب غير صحيح'
        );
        return;
      }
      setOrder(data.order);
      setItems(data.items);
    } catch {
      setError('حصل خطأ، جرّب تاني');
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <main dir="rtl" className="min-h-screen bg-black px-8 py-14 text-white">
      <div className="mx-auto max-w-xl">
        <span className="text-xs uppercase tracking-[.3em] text-amber-400">ثِقة</span>
        <h1 className="mt-3 text-3xl font-semibold">تتبّع طلبك</h1>
        <p className="mt-2 text-zinc-400">اكتب رقم الطلب (اتبعت لك بعد تأكيد الشراء) ورقم التليفون لو طلبت كضيف.</p>

        <div className="mt-8 space-y-4">
          {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
          <input placeholder="رقم الطلب" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
          <input placeholder="رقم التليفون (لو طلبت كضيف)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
          <button onClick={lookup} disabled={loading} className="w-full rounded-full bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50">
            {loading ? 'جاري البحث...' : 'تتبّع الطلب'}
          </button>
        </div>

        {order && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[.03] p-6">
            <div className="flex items-center justify-between">
              <b>حالة الطلب</b>
              <span className="rounded-full border border-amber-400/40 px-3 py-1 text-xs text-amber-300">{STATUS_LABELS[order.status] ?? order.status}</span>
            </div>

            {stepIndex >= 0 && (
              <div className="mt-5 flex gap-2">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-amber-400' : 'bg-white/10'}`} title={STATUS_LABELS[s]} />
                ))}
              </div>
            )}
            {(order.status === 'cancelled' || order.status === 'refunded') && (
              <p className="mt-4 text-red-300">{STATUS_LABELS[order.status]}</p>
            )}

            <div className="mt-6 space-y-3">
              {items.map((it) => (
                <div key={it.productId} className="flex items-center justify-between text-sm">
                  <span>{it.name} × {it.quantity}</span>
                  <span className="text-zinc-400">{money(it.unitPrice * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-sm">
              <span className="text-zinc-400">طريقة الدفع</span>
              <span>{order.paymentMethod === 'cod' ? 'كاش عند الاستلام' : 'كارت'}</span>
            </div>
            <div className="mt-2 flex justify-between font-semibold">
              <span>الإجمالي</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
