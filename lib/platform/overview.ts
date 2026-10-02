export type ServiceHealth = {
  id: string; label: string; status: 'operational' | 'degraded' | 'watch'; p95: number; uptime: number; owner: string;
};

export const platformOverview = {
  generatedAt: () => new Date().toISOString(),
  kpis: {
    gmvToday: 184620,
    ordersToday: 1248,
    conversion: 4.82,
    trustIndex: 98.4,
    activeMerchants: 1842,
    activeProducts: 68420,
  },
  services: [
    { id: 'discovery', label: 'Discovery', status: 'operational', p95: 118, uptime: 99.98, owner: 'Experience' },
    { id: 'checkout', label: 'Checkout', status: 'operational', p95: 176, uptime: 99.97, owner: 'Commerce' },
    { id: 'payments', label: 'Payments', status: 'watch', p95: 244, uptime: 99.94, owner: 'Finance' },
    { id: 'inventory', label: 'Inventory', status: 'operational', p95: 132, uptime: 99.99, owner: 'Supply' },
    { id: 'trust', label: 'Trust & Fraud', status: 'operational', p95: 96, uptime: 99.995, owner: 'Risk' },
    { id: 'ai', label: 'TRUST Intelligence', status: 'operational', p95: 210, uptime: 99.96, owner: 'AI' },
  ] satisfies ServiceHealth[],
  attention: [
    { severity: 'HIGH', title: 'Payment latency watch', detail: 'P95 ارتفع عن خط الأساس. لا يوجد فشل واسع حاليًا.', action: 'Inspect Payments' },
    { severity: 'MEDIUM', title: 'Low-stock cluster', detail: '14 منتجًا مرشحون لنفاد المخزون خلال 72 ساعة.', action: 'Open Inventory Radar' },
    { severity: 'LOW', title: 'Discovery opportunity', detail: 'هناك فرصة لتحسين ترتيب نتائج فئة الإكسسوارات.', action: 'Run Simulation' },
  ],
};
