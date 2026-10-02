import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '../../modules/platform/admin/access';

export default async function GlobalCommerceNetworkAdmin(){
  const session = await verifyAdminSession(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if(!session) redirect('/admin-login?next=/global-commerce-network-admin');
  return <main className="min-h-screen bg-black text-white p-8"><div className="mx-auto max-w-5xl"><p className="text-xs tracking-[.3em] text-amber-400">PRIVATE · V121</p><h1 className="mt-3 text-4xl font-semibold">Global Commerce Network Control</h1><div className="mt-8 grid gap-4 md:grid-cols-3">{['Seller verification','Network inventory','Cross-border providers'].map(x=><div key={x} className="rounded-2xl border border-white/10 p-5"><div>{x}</div><div className="mt-3 text-sm text-zinc-500">Provider connection status: not claimed</div></div>)}</div></div></main>;
}
