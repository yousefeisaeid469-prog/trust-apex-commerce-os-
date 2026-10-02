import type { CarrierMode,RouteCandidate,RouteSelection } from './contracts.ts';
import { listCarriers,listCarrierServices,supportsCountry,supportsCurrency } from './registry.ts';
export function rankCarrierRoutes(input:{country:string;currency:string;mode:CarrierMode;preferredCarrier?:string;avoidCarriers?:string[]}):RouteCandidate[]{
 const country=input.country.trim().toUpperCase(),currency=input.currency.trim().toUpperCase();
 const preferred=input.preferredCarrier?.trim().toUpperCase();const avoided=new Set((input.avoidCarriers??[]).map(x=>x.trim().toUpperCase()));
 const candidates:RouteCandidate[]=[];
 for(const carrier of listCarriers()){
  if(!supportsCountry(carrier,country)||!supportsCurrency(carrier,currency)||avoided.has(carrier.carrierCode))continue;
  const service=listCarrierServices(country,input.mode).find(s=>s.carrierCode===carrier.carrierCode);if(!service)continue;
  let score=100;const reasons:string[]=[];
  if(preferred&&carrier.carrierCode===preferred){score+=25;reasons.push('PREFERRED_CARRIER');}
  if(carrier.environment==='SANDBOX') {score-=5;reasons.push('SANDBOX_ADAPTER');}
  if(input.mode==='EXPRESS'&&service.maxDays<=4){score+=10;reasons.push('FAST_SERVICE');}
  candidates.push({carrier,service,score,reasons});
 }
 return candidates.sort((a,b)=>b.score-a.score||a.service.basePriceMinor<b.service.basePriceMinor?-1:a.service.basePriceMinor>b.service.basePriceMinor?1:a.carrier.carrierCode.localeCompare(b.carrier.carrierCode));
}
export function selectCarrierRoute(input:{country:string;currency:string;mode:CarrierMode;idempotencyKey:string;preferredCarrier?:string;avoidCarriers?:string[]}):RouteSelection{
 if(!input.idempotencyKey.trim())throw new Error('IDEMPOTENCY_KEY_REQUIRED');
 const candidates=rankCarrierRoutes(input);if(!candidates.length)throw new Error('NO_CARRIER_ROUTE_AVAILABLE');
 const best=candidates[0];return {carrierCode:best.carrier.carrierCode,serviceCode:best.service.serviceCode,score:best.score,reasons:best.reasons,idempotencyKey:input.idempotencyKey.trim()};
}
