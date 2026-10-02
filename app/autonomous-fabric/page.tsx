import {loadFabricOverview} from '../../modules/platform/autonomous-commerce-data-plane/core';
import {query,databaseConfigured} from '../../modules/platform/db/postgres';

export const dynamic='force-dynamic';

async function getOverview(){
  if(!databaseConfigured()) return null;
  return loadFabricOverview({query: async (sql,params)=>query(sql,params), transaction: async fn=>fn({query:async(s,p)=>query(s,p),transaction:async inner=>inner({query:async(s,p)=>query(s,p),transaction:async()=>{throw new Error('NESTED_TRANSACTION_UNSUPPORTED')}})})});
}

export default async function AutonomousFabric(){
  let overview=null; let unavailable=false;
  try{overview=await getOverview();}catch{unavailable=true;}
  return <main style={{padding:32,fontFamily:'Inter,system-ui',background:'#050505',color:'#fff',minHeight:'100vh'}}>
    <p style={{color:'#D4AF37',letterSpacing:1}}>TRUST V180 · PRODUCTION DATA PLANE</p>
    <h1 style={{fontSize:42,marginBottom:8}}>Autonomous Commerce Fabric</h1>
    <p style={{color:'#aaa',maxWidth:820}}>Database-backed operational surface. Agent state, commerce telemetry, fraud assessments and catalog inventory are read from PostgreSQL; this page does not substitute a static feature list when the database is available.</p>
    {!overview ? <section style={{marginTop:28,border:'1px solid #333',borderRadius:16,padding:22}}><strong>{unavailable?'Database unavailable':'Database not configured'}</strong><p style={{color:'#999'}}>Set DATABASE_URL and run the canonical migrations to activate live commerce data.</p></section> : <>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'28px 0'}}>{[['Health',`${overview.healthScore}%`],['Autonomy',`${Math.round(overview.autonomyRate*100)}%`],['Inventory value',`${overview.inventoryValue.toLocaleString()} EGP`],['Avg rating',overview.averageRating.toFixed(2)],['Fraud posture',overview.fraudRisk.toUpperCase()]].map(([k,v])=><div key={k} style={{border:'1px solid #242424',borderRadius:16,padding:18}}><div style={{color:'#888',fontSize:13}}>{k}</div><strong style={{fontSize:24}}>{v}</strong></div>)}</section>
      <h2>Registered agents</h2><div style={{display:'grid',gap:10}}>{overview.agents.map(a=><div key={`${a.tenantId}:${a.agentId}`} style={{border:'1px solid #242424',borderRadius:14,padding:16,display:'flex',justifyContent:'space-between',gap:16}}><div><strong>{a.name}</strong><div style={{color:'#888',fontSize:13}}>{a.agentId} · tenant {a.tenantId} · v{a.version} · trust {(a.trustScore*100).toFixed(0)}%</div></div><div style={{textAlign:'right'}}><div>{a.status} · {a.maxAutonomy}</div><div style={{color:'#888',fontSize:13}}>load {a.load}</div></div></div>)}</div>
      <h2 style={{marginTop:28}}>Next-best products</h2><div style={{display:'grid',gap:10}}>{overview.topProducts.map(p=><div key={p.id} style={{border:'1px solid #242424',borderRadius:14,padding:16}}><strong>{p.name}</strong><div style={{color:'#aaa'}}>{p.merchant} · {p.price.toLocaleString()} EGP · {p.rating}/5 · stock {p.stock}</div><div style={{color:'#888',fontSize:13}}>decision score {p.score.toFixed(3)} — {p.reason}</div></div>)}</div>
    </>}
  </main>;
}
