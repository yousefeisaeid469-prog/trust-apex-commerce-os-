import Link from 'next/link';
import { getSwitchingExperience } from '../../modules/experience/switching/engine';

export default function TrustDifferencePage() {
  const experience = getSwitchingExperience();
  return (
    <main className="min-h-screen bg-[#070809] text-white px-5 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs uppercase tracking-[.28em] text-amber-300">TRUST / CONSUMER ADVANTAGE</p><h1 className="mt-2 text-4xl font-semibold md:text-6xl">ليه العميل يختار TRUST؟</h1><p className="mt-4 max-w-2xl text-white/60">مش مجرد متجر أرخص. الهدف هو تجربة تقلل القلق، تزيد الثقة، وتخلي الشراء والمتابعة والإرجاع أسهل من أول لحظة لآخر لحظة.</p></div>
          <Link href="/" className="rounded-full border border-white/15 px-5 py-3 text-sm hover:bg-white/5">العودة للمنصة</Link>
        </header>

        <section className="grid gap-5 md:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-white/[.03] p-7 md:p-10">
            <p className="text-sm text-white/50">Switching Experience Score</p><div className="mt-4 text-7xl font-bold text-amber-200">{experience.score}<span className="text-2xl text-white/40">/100</span></div>
            <div className="mt-7 space-y-3">{experience.reasons.map((r)=><div key={r} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">✓ {r}</div>)}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {experience.benefits.map((b)=><article key={b.id} className="rounded-3xl border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-amber-300/30"><div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-200">{b.promise}</span><span className="text-amber-200">✦</span></div><h2 className="text-lg font-semibold">{b.title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{b.description}</p></article>)}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['01','قبل الشراء','Price Shield + seller proof + real ETA'],
            ['02','أثناء الشراء','Smart bundles + clear total cost + saved preferences'],
            ['03','بعد الشراء','Live order journey + proactive notifications'],
            ['04','لو حصلت مشكلة','One-tap return + refund workflow + human escalation'],
          ].map(([n,t,d])=><div key={n} className="rounded-3xl border border-white/10 p-6"><span className="text-xs text-amber-200">{n}</span><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-2 text-sm text-white/50">{d}</p></div>)}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[.03] p-7 md:p-10"><div className="grid gap-8 md:grid-cols-3"><div><p className="text-xs uppercase tracking-widest text-amber-200">THE NORTH STAR</p><h2 className="mt-2 text-2xl font-semibold">مش كل منافسة لازم تكون في السعر.</h2></div><div className="md:col-span-2 grid gap-4 sm:grid-cols-3"><div><b>Trust</b><p className="mt-1 text-sm text-white/50">شفافية البائع والمنتج والمراجعات.</p></div><div><b>Convenience</b><p className="mt-1 text-sm text-white/50">رحلة شراء وإرجاع ومتابعة بلا احتكاك.</p></div><div><b>Discovery</b><p className="mt-1 text-sm text-white/50">اكتشاف شخصي مفيد بدل إغراق العميل.</p></div></div></div></section>
      </div>
    </main>
  );
}
