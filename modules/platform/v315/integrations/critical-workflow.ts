import {routeWithFailover,type PaymentProvider} from '../../v314/payments/core.ts';
import {FailureInjector} from '../verification/failure-injection.ts';
import {sandboxPayment,sandboxCarrier} from './provider-sandbox.ts';
import {replay} from '../verification/replay.ts';
export type CriticalWorkflowInput={tenantId:string;orderId:string;currency:string;method:string;amountMinor:bigint;providers:PaymentProvider[];carrierId:string};
export async function runCriticalCommerceScenario(input:CriticalWorkflowInput){
  const paymentEvents:any[]=[]; const injector=new FailureInjector().set({point:'PAYMENT_PROVIDER',mode:'ONCE'});
  const routed=routeWithFailover(input.providers,{currency:input.currency,method:input.method});
  let payment:any; const first=routed.provider;
  try{if(injector.shouldFail('PAYMENT_PROVIDER',1))throw new Error('INJECTED_FAILURE:PAYMENT_PROVIDER'); payment=sandboxPayment({id:first.id,currency:input.currency,method:input.method,available:true},{operation:'CAPTURE',idempotencyKey:`${input.orderId}:capture`,amountMinor:input.amountMinor});}
  catch(error){paymentEvents.push({sequence:1,type:'PAYMENT_FAILED',payload:{providerId:first.id,error:String(error)},at:new Date().toISOString()});
    const fallback=routed.attempts.length<2?routeWithFailover(input.providers,{currency:input.currency,method:input.method,exclude:[first.id]}).provider:null;
    if(!fallback)throw new Error('NO_PAYMENT_FAILOVER');
    payment=sandboxPayment({id:fallback.id,currency:input.currency,method:input.method,available:true},{operation:'CAPTURE',idempotencyKey:`${input.orderId}:capture`,amountMinor:input.amountMinor});
    paymentEvents.push({sequence:2,type:'PAYMENT_CAPTURED',payload:{providerId:fallback.id},at:new Date().toISOString()});
  }
  const carrierInjector=new FailureInjector().set({point:'CARRIER',mode:'ONCE'}); let shipment:any; try{if(carrierInjector.shouldFail('CARRIER',1))throw new Error('INJECTED_FAILURE:CARRIER');shipment=sandboxCarrier({carrierId:input.carrierId,trackingSeed:`${input.orderId}:shipment`});}catch(error){paymentEvents.push({sequence:3,type:'CARRIER_FAILED',payload:{error:String(error)},at:new Date().toISOString()});shipment=sandboxCarrier({carrierId:input.carrierId,trackingSeed:`${input.orderId}:shipment:retry`});paymentEvents.push({sequence:4,type:'CARRIER_REROUTED',payload:{trackingNumber:shipment.trackingNumber},at:new Date().toISOString()});}
  paymentEvents.push({sequence:5,type:'FULFILLMENT_READY',payload:{trackingNumber:shipment.trackingNumber},at:new Date().toISOString()});
  const replayReceipt=replay(paymentEvents,(state,event)=>({...state,last:event.type,providerId:event.payload.providerId??state.providerId,trackingNumber:event.payload.trackingNumber??state.trackingNumber}));
  return {payment,shipment,events:paymentEvents,replayReceipt};
}
