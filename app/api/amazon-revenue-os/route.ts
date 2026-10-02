import {NextResponse} from 'next/server';
import {buildRevenuePortfolio,rankMonetizationOpportunities,quoteRevenueCharge,postRevenueCharge,snapshotRevenueEngine} from '../../../modules/platform/amazon-revenue-os';
import {databaseConfigured} from '../../../modules/platform/db/postgres';
import {listRevenueLedger,persistRevenueCharge} from '../../../modules/platform/amazon-revenue-os/ledger';
export const dynamic='force-dynamic';
const json=(v:any)=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x));
export async function GET(req:Request){const u=new URL(req.url);const tenantId=u.searchParams.get('tenantId');let ledger:any[]=[];if(tenantId&&databaseConfigured())ledger=await listRevenueLedger(tenantId);return NextResponse.json(json({ok:true,version:'216.0.0',portfolio:buildRevenuePortfolio(),opportunities:rankMonetizationOpportunities({trafficIntent:72,repeatRate:55,sellerCount:480,b2bDemand:60,crossBorderDemand:58,fulfillmentDemand:65,brandDemand:52,mediaDemand:40}),ledger,storage:databaseConfigured()?'postgres':'memory-only',guardrail:'quoted revenue is not posted revenue; posting requires verifiable evidence.'}),{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){const b=await req.json().catch(()=>({}));try{
 if(b.mode==='quote'){const charge=quoteRevenueCharge(b.input);return NextResponse.json(json({ok:true,charge,financialSideEffect:false}));}
 if(b.mode==='post'){const charge=postRevenueCharge(b.charge,b.evidence);if(b.tenantId&&databaseConfigured())return NextResponse.json(json({ok:true,posted:await persistRevenueCharge({tenantId:b.tenantId,charge,status:'POSTED'})}));return NextResponse.json(json({ok:true,charge,storage:'memory-only',financialSideEffect:false}));}
 if(b.mode==='snapshot'){return NextResponse.json(json({ok:true,snapshot:snapshotRevenueEngine(b.charges??[])}));}
 if(b.mode==='ledger'&&b.tenantId&&databaseConfigured())return NextResponse.json(json({ok:true,ledger:await listRevenueLedger(b.tenantId,b.limit)}));
 if(b.mode==='portfolio')return NextResponse.json(json({ok:true,portfolio:buildRevenuePortfolio((b.events??[]).map((e:any)=>({...e,amountMinor:BigInt(e.amountMinor)})))}));
 if(b.mode==='opportunities')return NextResponse.json({ok:true,opportunities:rankMonetizationOpportunities(b.input??{})});
 return NextResponse.json({ok:false,error:'UNKNOWN_MODE'},{status:400});
}catch(e:any){return NextResponse.json({ok:false,error:e?.message??'REVENUE_ENGINE_ERROR'},{status:400});}}
