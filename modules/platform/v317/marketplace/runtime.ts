import { reserveInventoryTransactionTx } from '../../../commerce/inventory/transaction-engine';
import {query,withPgTransaction} from '../../db/postgres.ts';
import {sandboxPayment} from '../../v315/integrations/provider-sandbox.ts';
import {calculate,workflowId} from './engine.ts';
import type {MarketplaceExecutionCommand,MarketplaceExecutionResult,V317Stage} from './contracts.ts';
const major=(minor:bigint)=>(Number(minor)/100).toFixed(2);
const event=async(client:any,id:string,type:string,payload:any)=>client.query(`insert into trust_v317_marketplace_events(execution_id,event_type,payload_json) values($1,$2,$3::jsonb) on conflict(execution_id,event_type) do nothing`,[id,type,JSON.stringify(payload)]);
export async function executeMarketplace(command:MarketplaceExecutionCommand):Promise<MarketplaceExecutionResult>{
  const wf=workflowId(command), calc=calculate(command);
  return withPgTransaction(async client=>{
    const prior=await client.query<any>(`select result_json,status from trust_v317_marketplace_executions where idempotency_key=$1 for update`,[command.idempotencyKey]);
    if(prior.rows[0]){if(prior.rows[0].status!=='COMPLETED') throw new Error('V317_EXECUTION_INCOMPLETE'); return hydrate(prior.rows[0].result_json);}
    const tenant=await client.query<any>(`select id,state from trust_tenants where id=$1 for update`,[command.tenantId]);
    if(!tenant.rows[0]||tenant.rows[0].state!=='active') throw new Error('V317_TENANT_NOT_ACTIVE');
    const seller=await client.query<any>(`select id,verification_status from trust_merchant_profiles where id=$1 for update`,[command.sellerId]);
    if(!seller.rows[0]||seller.rows[0].verification_status!=='verified') throw new Error('V317_SELLER_NOT_VERIFIED');
    const offer=await client.query<any>(`select id,product_id,merchant_id,price,shipping_fee,stock,delivery_min_days,delivery_max_days,fulfillment_mode,status from trust_marketplace_offers where id=$1 for update`,[command.offerId]);
    if(!offer.rows[0]||offer.rows[0].status!=='ACTIVE') throw new Error('V317_OFFER_NOT_ACTIVE');
    if(String(offer.rows[0].product_id)!==command.productId||String(offer.rows[0].merchant_id)!==command.sellerId) throw new Error('V317_OFFER_OWNERSHIP_MISMATCH');
    if(Math.round(Number(offer.rows[0].price)*100)!==Number(command.unitPriceMinor)) throw new Error('V317_PRICE_SNAPSHOT_MISMATCH');
    const inventory=await reserveInventoryTransactionTx(client, { productId:command.productId, offerId:command.offerId, quantity:command.quantity, idempotencyKey:`v317:${command.idempotencyKey}:inventory`, source:'V317_MARKETPLACE_EXECUTION', metadata:{ reservationStatus:'reserved', workflowId:wf } });
    if(inventory.replay) { /* workflow idempotency remains the authoritative replay boundary */ }
    const execution=await client.query<any>(`insert into trust_v317_marketplace_executions(workflow_id,idempotency_key,status,tenant_id,seller_id,customer_id,product_id,offer_id) values($1,$2,'RUNNING',$3,$4,$5,$6,$7) returning id`,[wf,command.idempotencyKey,command.tenantId,command.sellerId,command.customerId,command.productId,command.offerId]);
    const executionId=execution.rows[0].id;
    await event(client,executionId,'WORKFLOW_STARTED',{workflowId:wf,stage:'TENANT'});
    const order=await client.query<any>(`insert into trust_orders(customer_id,status,subtotal,discount,shipping,total,currency,idempotency_key,request_hash) values($1,'pending',$2,0,$3,$4,$5,$6,$7) returning id`,[command.customerId,major(calc.subtotalMinor),major(calc.shippingMinor),major(calc.totalMinor),command.currency,`v317:${command.idempotencyKey}`,wf]);
    const orderId=order.rows[0].id;
    await client.query(`insert into trust_order_items(order_id,product_id,quantity,unit_price) values($1,$2,$3,$4)`,[orderId,command.productId,command.quantity,major(command.unitPriceMinor)]);
    const reservation=await client.query<any>(`insert into trust_inventory_reservations(order_id,product_id,offer_id,quantity,status,expires_at) values($1,$2,$3,$4,'reserved',now()+interval '30 minutes') returning id`,[orderId,command.productId,command.offerId,command.quantity]);
    const reservationId=reservation.rows[0].id;
    await event(client,executionId,'INVENTORY_RESERVED',{orderId,reservationId,quantity:command.quantity});
    const payment=sandboxPayment({id:'v317-sandbox-primary',currency:command.currency,method:'CARD',available:true},{operation:'CAPTURE',idempotencyKey:`v317:${command.idempotencyKey}:capture`,amountMinor:calc.totalMinor});
    const pay=await client.query<any>(`insert into trust_payments(order_id,provider,payment_intent_id,amount,currency,status,idempotency_key,metadata) values($1,$2,$3,$4,$5,'captured',$6,$7::jsonb) returning id`,[orderId,payment.providerId,payment.providerReference,major(calc.totalMinor),command.currency,`v317:${command.idempotencyKey}:payment`,JSON.stringify({sandbox:true,workflowId:wf})]);
    const paymentId=pay.rows[0].id;
    await client.query(`update trust_orders set status='processing',updated_at=now() where id=$1`,[orderId]);
    const shipment=await client.query<any>(`insert into trust_order_shipments(order_id,merchant_id,destination_region,min_days,max_days,shipping_cost,fulfillment_cost,source,offer_ids) values($1,$2,$3,$4,$5,$6,$7,'OFFER_FALLBACK',$8::jsonb) returning id`,[orderId,command.sellerId,command.destinationRegion??'GLOBAL',offer.rows[0].delivery_min_days,offer.rows[0].delivery_max_days,major(calc.shippingMinor),major(calc.shippingMinor),JSON.stringify([command.offerId])]);
    const shipmentId=shipment.rows[0].id;
    const program=offer.rows[0].fulfillment_mode==='TRUST_FULFILLED'?'PLATFORM_FULFILLMENT':'SELLER_FULFILLED';
    const fulfillment=await client.query<any>(`insert into trust_marketplace_fulfillment_orders(order_id,order_shipment_id,merchant_id,program_code,status,item_count,min_days,max_days,destination_region,idempotency_key) values($1,$2,$3,$4,'PLANNED',$5,$6,$7,$8,$9) returning id`,[orderId,shipmentId,command.sellerId,program,command.quantity,offer.rows[0].delivery_min_days,offer.rows[0].delivery_max_days,command.destinationRegion??'GLOBAL',`v317:${command.idempotencyKey}:fulfillment`]);
    const fulfillmentOrderId=fulfillment.rows[0].id;
    const settlement=await client.query<any>(`insert into trust_marketplace_payment_settlements(payment_id,order_id,gross_amount,seller_net,platform_fee,payment_fee,fulfillment_fee,return_fee,currency,status,idempotency_key) values($1,$2,$3,$4,$5,0,$6,0,$7,'PENDING',$8) returning id`,[paymentId,orderId,major(calc.totalMinor),major(calc.sellerNetMinor),major(calc.commissionMinor),major(calc.fulfillmentFeeMinor),command.currency,`v317:${command.idempotencyKey}:settlement`]);
    const settlementId=settlement.rows[0].id;
    await client.query(`insert into trust_marketplace_payment_ledger(order_id,payment_id,merchant_id,entry_type,amount,direction,currency,idempotency_key,metadata_json) values($1,$2,$3,'CUSTOMER_CHARGE',$4,'DEBIT',$5,$6,$7::jsonb),($1,$2,$3,'SELLER_CREDIT',$8,'CREDIT',$5,$9,$7::jsonb),($1,$2,$3,'PLATFORM_FEE',$10,'CREDIT',$5,$11,$7::jsonb),($1,$2,$3,'HOLD',$12,'CREDIT',$5,$13,$7::jsonb)`,[orderId,paymentId,command.sellerId,major(calc.totalMinor),command.currency,`v317:${command.idempotencyKey}:ledger:customer`,major(calc.sellerNetMinor),`v317:${command.idempotencyKey}:ledger:seller`,major(calc.commissionMinor),`v317:${command.idempotencyKey}:ledger:platform`,major(calc.fulfillmentFeeMinor),`v317:${command.idempotencyKey}:ledger:fulfillment`,JSON.stringify({workflowId:wf})]);
    await client.query(`insert into trust_marketplace_fee_assessments(order_id,merchant_id,fee_type,program_code,base_amount,rate_bps,fee_amount,currency,idempotency_key) values($1,$2,'COMMISSION','MARKETPLACE',$3,$4,$5,$6,$7)`,[orderId,command.sellerId,major(calc.subtotalMinor),command.commissionBps,major(calc.commissionMinor),command.currency,`v317:${command.idempotencyKey}:fee`]);
    await client.query(`insert into trust_marketplace_seller_balances(merchant_id,pending_balance,available_balance,held_balance,currency) values($1,$2,0,0,$3) on conflict(merchant_id) do update set pending_balance=trust_marketplace_seller_balances.pending_balance+excluded.pending_balance,updated_at=now()`,[command.sellerId,major(calc.sellerNetMinor),command.currency]);
    const result:MarketplaceExecutionResult={executionId,workflowId:wf,status:'COMPLETED',orderId,paymentId,reservationId,shipmentId,fulfillmentOrderId,settlementId,subtotalMinor:calc.subtotalMinor,shippingMinor:calc.shippingMinor,totalMinor:calc.totalMinor,commissionMinor:calc.commissionMinor,fulfillmentFeeMinor:calc.fulfillmentFeeMinor,sellerNetMinor:calc.sellerNetMinor,currency:command.currency,providerReference:payment.providerReference,stages:Object.fromEntries((['TENANT','SELLER','CATALOG','INVENTORY','ORDER','PAYMENT','FULFILLMENT','FINANCE','ANALYTICS'] as V317Stage[]).map(s=>[s,'COMPLETED'])) as Record<V317Stage,'COMPLETED'>,replaySafe:true};
    const json=JSON.stringify({...result,subtotalMinor:result.subtotalMinor.toString(),shippingMinor:result.shippingMinor.toString(),totalMinor:result.totalMinor.toString(),commissionMinor:result.commissionMinor.toString(),fulfillmentFeeMinor:result.fulfillmentFeeMinor.toString(),sellerNetMinor:result.sellerNetMinor.toString()});
    await client.query(`update trust_v317_marketplace_executions set status='COMPLETED',order_id=$1,payment_id=$2,reservation_id=$3,shipment_id=$4,fulfillment_order_id=$5,settlement_id=$6,result_json=$7::jsonb,completed_at=now(),updated_at=now() where id=$8`,[orderId,paymentId,reservationId,shipmentId,fulfillmentOrderId,settlementId,json,executionId]);
    for(const stage of ['TENANT','SELLER','CATALOG','INVENTORY','ORDER','PAYMENT','FULFILLMENT','FINANCE','ANALYTICS'] as V317Stage[]) await event(client,executionId,`STAGE_${stage}_COMPLETED`,{workflowId:wf,orderId,paymentId});
    await event(client,executionId,'ANALYTICS_ORDER_COMPLETED',{orderId,totalMinor:calc.totalMinor.toString(),currency:command.currency});
    return result;
  });
}
function hydrate(raw:any):MarketplaceExecutionResult{return {...raw,subtotalMinor:BigInt(raw.subtotalMinor),shippingMinor:BigInt(raw.shippingMinor),totalMinor:BigInt(raw.totalMinor),commissionMinor:BigInt(raw.commissionMinor),fulfillmentFeeMinor:BigInt(raw.fulfillmentFeeMinor),sellerNetMinor:BigInt(raw.sellerNetMinor)};}
export async function getMarketplaceExecution(idempotencyKey:string){const r=await query<any>(`select result_json from trust_v317_marketplace_executions where idempotency_key=$1`,[idempotencyKey]);return r.rows[0]?hydrate(r.rows[0].result_json):undefined;}
