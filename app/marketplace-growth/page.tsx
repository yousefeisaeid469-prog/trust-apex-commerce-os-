export default function MarketplaceGrowthPage(){
  const cards=[
    ['Marketplace take-rate','Commission + seller plan fees','Direct platform monetization'],
    ['Sponsored discovery','Sponsored Product / Brand / Display','Budget + CPC guardrails'],
    ['Recurring commerce','Customer memberships + product subscriptions','Retention + recurring GMV'],
    ['Fulfillment services','Storage + pick/pack + shipping + returns','Service-fee revenue'],
    ['B2B commerce','Business accounts + quantity pricing','Higher-value procurement'],
    ['Affiliate commerce','Attributed orders + commission ledger','Performance-based acquisition'],
  ];
  return <main style={{maxWidth:1200,margin:'0 auto',padding:'48px 24px'}}><p style={{opacity:.65}}>TRUST V270</p><h1>Marketplace Growth & Monetization</h1><p style={{maxWidth:760}}>A real commerce runtime for the revenue surfaces that matter: marketplace fees, seller plans, sponsored discovery, subscriptions, fulfillment and B2B. No audit-only placeholder.</p><section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginTop:32}}>{cards.map(([a,b,c])=><article key={a} style={{border:'1px solid #ddd',borderRadius:16,padding:20}}><h2>{a}</h2><strong>{b}</strong><p>{c}</p></article>)}</section></main>
}
