export type OrderTimelineStatus = 'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded';
export type OrderTimelineEvent = { status: OrderTimelineStatus; label: string; at: string; current: boolean };
export type OrderAction = 'cancel'|'track';
export type OrderActionState = { action: OrderAction; allowed: boolean; reason?: string };

export const ORDER_STATUS_LABELS: Record<OrderTimelineStatus,string> = {
  pending:'بانتظار تأكيد الدفع', confirmed:'تم تأكيد الطلب', processing:'جاري التجهيز', shipped:'خرج للتوصيل', delivered:'تم التسليم', cancelled:'ملغي', refunded:'مسترجع'
};
export const ORDER_STATUS_STEPS: OrderTimelineStatus[] = ['confirmed','processing','shipped','delivered'];
