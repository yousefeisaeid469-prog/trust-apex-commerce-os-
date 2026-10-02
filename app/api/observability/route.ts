import {NextResponse} from 'next/server';
import {buildObservabilityReport, normalizeTelemetry, type Incident, type MetricSample, type RegionHealth, type SLO, type TelemetryEvent} from '../../../modules/platform/observability';
import {query} from '../../../modules/platform/db/postgres';
export const dynamic='force-dynamic';

async function persist(events:TelemetryEvent[],incidents:Incident[]){
  if(!process.env.DATABASE_URL) return {persisted:false};
  for(const e of events) await query(`INSERT INTO trust_observability_events(event_id,kind,name,occurred_at,duration_ms,success,region,route,attributes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) ON CONFLICT(event_id) DO NOTHING`,[e.id,e.kind,e.name,e.timestamp,e.durationMs??null,e.success??null,e.region??null,e.route??null,JSON.stringify(e.attributes??{})]);
  for(const i of incidents) await query(`INSERT INTO trust_incidents(incident_id,severity,status,title,region,started_at,resolved_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(incident_id) DO UPDATE SET severity=EXCLUDED.severity,status=EXCLUDED.status,title=EXCLUDED.title,region=EXCLUDED.region,resolved_at=EXCLUDED.resolved_at,updated_at=now()`,[i.id,i.severity,i.status,i.title,i.region??null,i.startedAt,i.resolvedAt??null]);
  return {persisted:true};
}
export async function GET(){return NextResponse.json({ok:true,report:buildObservabilityReport({slos:[{id:'availability-99.9',target:99.9,windowMinutes:60,metric:'AVAILABILITY'}]})},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
  try{const body=await req.json(); const events=normalizeTelemetry(Array.isArray(body?.events)?body.events:[]); const incidents:Array<Incident>=Array.isArray(body?.incidents)?body.incidents:[]; const report=buildObservabilityReport({events,metrics:Array.isArray(body?.metrics)?body.metrics as MetricSample[]:[],slos:Array.isArray(body?.slos)?body.slos as SLO[]:[],regions:Array.isArray(body?.regions)?body.regions as RegionHealth[]:[],incidents,traceId:String(req.headers.get('x-request-id')??'')||undefined}); let storage={persisted:false}; if(events.length||incidents.length) storage=await persist(events,incidents); return NextResponse.json({ok:true,report,storage},{status:200});}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'OBSERVABILITY_FAILED'},{status:400});}
}
