import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '../../modules/platform/admin/access';

export default async function MerchantSupergraphAdminPage(){
  const session = await verifyAdminSession(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if(!session) redirect('/admin-login?next=/merchant-supergraph-admin');
  return <main className="min-h-screen bg-black text-white px-6 py-16 md:px-12"><div className="mx-auto max-w-7xl">
    <p className="text-xs uppercase tracking-[.35em] text-amber-400">TRUST V122 · PRIVATE ADMIN</p>
    <h1 className="mt-4 text-4xl font-semibold md:text-6xl">Merchant Supergraph</h1>
    <p className="mt-5 max-w-3xl text-zinc-400 text-lg">طبقة الربط التي تجمع التجار، العروض، المخزون، السمعة والخدمات في Graph واحد قابل للتوجيه.</p>
    <section className="mt-10 grid gap-4 md:grid-cols-4">{[['MERCHANT NODES','Seller identity + status'],['PRODUCT EDGES','Offer relationships'],['SERVICE EDGES','Region + fulfillment'],['REPUTATION','Dimension-aware trust']].map(([a,b])=><div key={a} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="text-amber-400 text-xs tracking-widest">{a}</div><div className="mt-3 text-sm text-zinc-400">{b}</div></div>)}</section>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.03] p-6"><h2 className="text-xl font-semibold">Routing principle</h2><p className="mt-3 text-zinc-400">TRUST لا يختار أرخص عرض فقط؛ الـrouting يوازن بين الثقة، السمعة، إشارة السعر، والخدمة، مع استبعاد التجار غير الموثقين والعروض غير القابلة للشراء.</p><div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-zinc-300">Live carrier, FX, tax, KYC and settlement providers remain disconnected until configured and verified.</div></section>
  </div></main>;
}
