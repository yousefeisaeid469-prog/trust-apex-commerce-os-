import type {Incident, MetricSample, ObservabilityReport, RegionHealth, SLO, TelemetryEvent} from './contracts';

export function redactTelemetryAttributes(input:Record<string,string|number|boolean>|undefined){
  if(!input) return {};
  const blocked=/token|secret|password|authorization|cookie|email|phone|address|card|cvv|ssn|api.?key/i;
  return Object.fromEntries(Object.entries(input).filter(([k])=>!blocked.test(k)).slice(0,30));
}

export function normalizeTelemetry(events:TelemetryEvent[]):TelemetryEvent[]{
  const seen=new Set<string>(); const out:TelemetryEvent[]=[];
  for(const e of events){
    if(!e?.id||seen.has(e.id)||!e.name||!e.timestamp) continue;
    seen.add(e.id);
    out.push({...e, durationMs:e.durationMs===undefined?undefined:Math.max(0,Math.round(e.durationMs)),attributes:redactTelemetryAttributes(e.attributes)});
  }
  return out.sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
}

function findMetric(metrics:MetricSample[],name:MetricSample['name']){return metrics.find(x=>x.name===name)?.value ?? 0;}
export function evaluateSLOs(slos:SLO[],metrics:MetricSample[]){
  return slos.map(s=>{
    const observed=s.metric==='AVAILABILITY' ? Math.max(0,100-findMetric(metrics,'ERROR_RATE')) : s.metric==='ERROR_RATE' ? findMetric(metrics,'ERROR_RATE') : findMetric(metrics,'P95_MS');
    const pass=s.metric==='ERROR_RATE'||s.metric==='LATENCY_P95' ? observed<=s.target : observed>=s.target;
    const budget=s.metric==='ERROR_RATE'||s.metric==='LATENCY_P95' ? Math.max(0,s.target-observed) : Math.max(0,observed-s.target);
    const warn=!pass ? budget===0?'FAIL':'WARN' : 'PASS';
    return {id:s.id,status:warn as 'PASS'|'WARN'|'FAIL',observed,target:s.target,budgetRemaining:budget};
  });
}

export function assessRegions(regions:RegionHealth[]){
  return regions.map(r=>({...r,status:r.errorRate>=10?'OUTAGE':r.errorRate>=3||r.latencyP95Ms>1000?'DEGRADED':r.capacityPct>=95?'DEGRADED':'HEALTHY'} as RegionHealth));
}

export function buildObservabilityReport(input:{events?:TelemetryEvent[];metrics?:MetricSample[];slos?:SLO[];regions?:RegionHealth[];incidents?:Incident[];now?:string;traceId?:string}={}):ObservabilityReport{
  const events=normalizeTelemetry(input.events??[]);
  const metrics=(input.metrics??[]).slice(0,100);
  const sloResults=evaluateSLOs(input.slos??[],metrics);
  const regions=assessRegions(input.regions??[]);
  const incidents=(input.incidents??[]).filter(i=>i.status!=='RESOLVED');
  const blockers=[...sloResults.filter(x=>x.status==='FAIL').map(x=>`SLO ${x.id} failed`),...regions.filter(x=>x.status==='OUTAGE').map(x=>`Region ${x.region} outage`),...incidents.filter(x=>x.severity==='SEV1').map(x=>`Open SEV1: ${x.title}`)];
  const warnings=[...sloResults.filter(x=>x.status==='WARN').map(x=>`SLO ${x.id} warning`),...regions.filter(x=>x.status==='DEGRADED').map(x=>`Region ${x.region} degraded`),...incidents.filter(x=>x.severity!=='SEV1').map(x=>`Open ${x.severity}: ${x.title}`)];
  const checks=sloResults.length+regions.length+incidents.length; const penalty=blockers.length*35+warnings.length*10; const score=Math.max(0,Math.min(100,checks?Math.round(100-penalty/checks):100));
  return {version:'V223.0.0',generatedAt:input.now??new Date().toISOString(),traceId:input.traceId??`trace_${Date.now().toString(36)}`,metrics, sloResults, regions, incidents, blockers, warnings, ready:blockers.length===0, score};
}
