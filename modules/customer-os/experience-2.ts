export type CustomerOrder = { id:string; status:string; total:number; createdAt?:string; updatedAt?:string };
export type CustomerReturn = { id:string; orderId:string; status:string; createdAt?:string };
export type CustomerProfile = { displayName?:string; city?:string; phone?:string };
export type CustomerSnapshot = { profile:CustomerProfile; orders:CustomerOrder[]; returns:CustomerReturn[] };
export type CustomerTimelineItem = { id:string; kind:'order'|'return'; title:string; detail:string; status:string; timestamp?:string; href:string };

const statusLabels: Record<string,string> = {
  pending:'قيد المراجعة', paid:'مدفوع', confirmed:'تم التأكيد', processing:'قيد التجهيز', shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي',
  requested:'تم طلب المرتجع', approved:'تم قبول المرتجع', rejected:'تم رفض المرتجع', refunded:'تم رد المبلغ',
};

function label(status:string){ return statusLabels[status.toLowerCase()] ?? status; }

export function buildCustomerOverview(snapshot:CustomerSnapshot){
  const orders=[...snapshot.orders].sort((a,b)=>String(b.createdAt??b.updatedAt??'').localeCompare(String(a.createdAt??a.updatedAt??'')));
  const returns=[...snapshot.returns].sort((a,b)=>String(b.createdAt??'').localeCompare(String(a.createdAt??'')));
  const openOrders=orders.filter(o=>!['delivered','cancelled'].includes(o.status.toLowerCase())).length;
  const activeReturns=returns.filter(r=>!['rejected','refunded'].includes(r.status.toLowerCase())).length;
  const totalSpent=orders.filter(o=>!['cancelled'].includes(o.status.toLowerCase())).reduce((sum,o)=>sum+(Number.isFinite(o.total)?o.total:0),0);
  const needsAttention=activeReturns>0 || openOrders>0;
  return {displayName:snapshot.profile.displayName?.trim()||'عميل TRUST',orderCount:orders.length,openOrders,returnCount:returns.length,activeReturns,totalSpent,needsAttention};
}

export function buildCustomerTimeline(snapshot:CustomerSnapshot):CustomerTimelineItem[]{
  const orders=snapshot.orders.map(o=>({id:`order:${o.id}`,kind:'order' as const,title:`طلب ${o.id}`,detail:`${Number(o.total||0).toLocaleString('ar-EG')} ج.م`,status:label(o.status),timestamp:o.createdAt??o.updatedAt,href:`/order-tracker?order=${encodeURIComponent(o.id)}`}));
  const returns=snapshot.returns.map(r=>({id:`return:${r.id}`,kind:'return' as const,title:`مرتجع للطلب ${r.orderId}`,detail:'حالة طلب المرتجع',status:label(r.status),timestamp:r.createdAt,href:'/customer-os'}));
  return [...orders,...returns].sort((a,b)=>String(b.timestamp??'').localeCompare(String(a.timestamp??''))).slice(0,10);
}

export function buildCustomerPriorities(snapshot:CustomerSnapshot){
  const overview=buildCustomerOverview(snapshot);
  const priorities:string[]=[];
  if(overview.activeReturns) priorities.push('تابع طلبات المرتجعات المفتوحة');
  if(overview.openOrders) priorities.push('تابع الطلبات التي لم تصل بعد');
  if(!snapshot.profile.displayName?.trim()) priorities.push('أكمل اسم العرض في حسابك');
  if(!priorities.length) priorities.push('كل شيء هادئ — استكشف Marketplace واكتشف اختيارات جديدة');
  return priorities.slice(0,3);
}
