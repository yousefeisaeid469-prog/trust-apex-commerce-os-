import { deriveCommerceState, expectedNextCommerceState, reconcileStateObservation } from '../modules/commerce/core/state-reconciliation.ts';
const cases=[
  [{orderStatus:'confirmed',paymentStatus:null,executionStatus:null,fulfillmentCount:0,deliveredFulfillmentCount:0,shipmentCount:0,deliveredShipmentCount:0,settlementStatus:null,runtimeStatus:null,receiptPresent:true,executionJobCount:0},'CHECKOUT_COMMITTED'],
  [{orderStatus:'processing',paymentStatus:'captured',executionStatus:null,fulfillmentCount:0,deliveredFulfillmentCount:0,shipmentCount:0,deliveredShipmentCount:0,settlementStatus:null,runtimeStatus:'RUNNING',receiptPresent:true,executionJobCount:1},'PAYMENT_CAPTURED'],
  [{orderStatus:'processing',paymentStatus:'captured',executionStatus:'FULFILLMENT_PLANNED',fulfillmentCount:1,deliveredFulfillmentCount:0,shipmentCount:1,deliveredShipmentCount:0,settlementStatus:null,runtimeStatus:'RUNNING',receiptPresent:true,executionJobCount:1},'FULFILLMENT'],
  [{orderStatus:'delivered',paymentStatus:'captured',executionStatus:'COMPLETED',fulfillmentCount:1,deliveredFulfillmentCount:1,shipmentCount:1,deliveredShipmentCount:1,settlementStatus:'released',runtimeStatus:'SUCCEEDED',receiptPresent:true,executionJobCount:0},'COMPLETED'],
];
for(const [input,expected] of cases){const got=deriveCommerceState(input);if(got!==expected)throw new Error(`STATE_EXPECTATION_FAILED:${got}:${expected}`);}
const drift=reconcileStateObservation(cases[1][0]);
if(!drift.divergenceCodes.includes('CAPTURED_PAYMENT_WITHOUT_EXECUTION')||drift.recommendedAction!=='RESUME_EXECUTION')throw new Error('CAPTURED_PAYMENT_DRIFT_NOT_DETECTED');
const blocked=reconcileStateObservation({...cases[3][0],settlementStatus:'released',deliveredShipmentCount:0});
if(!blocked.divergenceCodes.includes('SETTLEMENT_BEFORE_DELIVERY')||blocked.reconciliationStatus!=='BLOCKED')throw new Error('SETTLEMENT_GATING_FAILED');
if(expectedNextCommerceState('DELIVERY')!=='SETTLEMENT')throw new Error('STATE_GRAPH_FAILED');
console.log('V419 STATE RECONCILIATION TEST PASS');
