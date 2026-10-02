import type { CarrierCapability,CarrierEnvironment,CarrierMode,CarrierProfile,CarrierService } from './contracts.ts';
const profiles:CarrierProfile[]=[
 {carrierCode:'TRUST-E2E',displayName:'TRUST deterministic sandbox carrier',environment:'SANDBOX',enabled:true,capabilities:['CREATE_LABEL','TRACK','CANCEL_LABEL'],countries:['EG','AE','SA','US','GB','DE','FR','IN'],currencies:['EGP','AED','SAR','USD','GBP','EUR','INR']},
 {carrierCode:'DHL',displayName:'DHL adapter descriptor',environment:'LIVE',enabled:false,capabilities:['CREATE_LABEL','TRACK','CANCEL_LABEL'],countries:['*'],currencies:['*']},
 {carrierCode:'FEDEX',displayName:'FedEx adapter descriptor',environment:'LIVE',enabled:false,capabilities:['CREATE_LABEL','TRACK','CANCEL_LABEL'],countries:['*'],currencies:['*']},
 {carrierCode:'UPS',displayName:'UPS adapter descriptor',environment:'LIVE',enabled:false,capabilities:['CREATE_LABEL','TRACK','CANCEL_LABEL'],countries:['*'],currencies:['*']},
];
const services:CarrierService[]=[];
for(const p of profiles){
 for(const mode of ['STANDARD','EXPRESS'] as CarrierMode[]){const currencies=p.currencies[0]==='*'?['USD']:p.currencies;for(const currency of currencies) services.push({carrierCode:p.carrierCode,serviceCode:`${p.carrierCode}-${mode}${currency===currencies[0]?'':`-${currency}`}`,mode,countries:p.countries,minDays:mode==='EXPRESS'?1:3,maxDays:mode==='EXPRESS'?4:10,basePriceMinor:mode==='EXPRESS'?950n:500n,currency,enabled:p.enabled});}
}
export function listCarriers(){return profiles.map(p=>({...p,capabilities:[...p.capabilities],countries:[...p.countries],currencies:[...p.currencies]}));}
export function getCarrier(carrierCode:string){const c=profiles.find(x=>x.carrierCode===carrierCode.trim().toUpperCase());if(!c)throw new Error('CARRIER_NOT_REGISTERED');return c;}
export function listCarrierServices(country:string,mode:CarrierMode){const c=country.trim().toUpperCase();return services.filter(s=>s.enabled&&s.mode===mode&&(s.countries.includes('*')||s.countries.includes(c)));}
export function supportsCountry(profile:CarrierProfile,country:string){return profile.enabled&&(profile.countries.includes('*')||profile.countries.includes(country.trim().toUpperCase()));}
export function supportsCurrency(profile:CarrierProfile,currency:string){return profile.enabled&&(profile.currencies.includes('*')||profile.currencies.includes(currency.trim().toUpperCase()));}
